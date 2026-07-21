import { concatBytes, utf8 } from "../lib/bytes";
import { type ImageLabel, renderLabeledImage } from "./image-label";

const SOI = new Uint8Array([0xff, 0xd8]);
const EOI = new Uint8Array([0xff, 0xd9]);

/** COM セグメントのデータ部最大（長さフィールド最大 65535 − 2） */
const MAX_COM_DATA = 65533;

/**
 * 1×1 グレースケールの最小有効 JPEG（EOI 込み）。
 * 標準的な量子化・ハフマン表を含む。
 */
export function buildMinimalJpeg(): Uint8Array {
  // APP0 JFIF
  const app0 = new Uint8Array([
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00,
    0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
  ]);

  // DQT: 輝度、全係数 1
  const dqtBody = new Uint8Array(65);
  dqtBody[0] = 0x00; // table 0, 8-bit
  dqtBody.fill(1, 1);
  const dqt = jpegSegment(0xdb, dqtBody);

  // SOF0: 1×1, 8-bit, 1 component (Y)
  const sof0 = jpegSegment(
    0xc0,
    new Uint8Array([
      0x08, // precision
      0x00,
      0x01, // height
      0x00,
      0x01, // width
      0x01, // components
      0x01,
      0x11,
      0x00, // id=1, sampling 1x1, quant table 0
    ]),
  );

  // DHT: DC table 0 — symbol 0 with length 1 (bitstring "0")
  // bits[1..16]: only length-1 has count 1; symbols: 0
  const dhtDc = jpegSegment(
    0xc4,
    new Uint8Array([
      0x00, // class 0 (DC), table 0
      0x00,
      0x01,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00, // bits
      0x00, // symbol: category 0
    ]),
  );

  // DHT: AC table 0 — EOB (0x00) with length 1 (bitstring "0")
  const dhtAc = jpegSegment(
    0xc4,
    new Uint8Array([
      0x10, // class 1 (AC), table 0
      0x00,
      0x01,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00, // EOB
    ]),
  );

  // SOS: 1 component, DC/AC table 0
  const sos = jpegSegment(
    0xda,
    new Uint8Array([0x01, 0x01, 0x00, 0x00, 0x3f, 0x00]),
  );

  // エントロピー符号化: DC diff=0 ("0") + AC EOB ("0") → 1 バイト 0x00
  // （残りビットは 0 埋め）
  const scan = new Uint8Array([0x00]);

  return concatBytes([SOI, app0, dqt, sof0, dhtDc, dhtAc, sos, scan, EOI]);
}

function jpegSegment(marker: number, data: Uint8Array): Uint8Array {
  const len = data.byteLength + 2;
  if (len > 0xffff) {
    throw new Error(`JPEG セグメント長超過: ${len}`);
  }
  const out = new Uint8Array(2 + 2 + data.byteLength);
  out[0] = 0xff;
  out[1] = marker;
  out[2] = (len >>> 8) & 0xff;
  out[3] = len & 0xff;
  out.set(data, 4);
  return out;
}

/** EOI (FF D9) の先頭オフセット。末尾付近から探す */
export function findEoiOffset(jpeg: Uint8Array): number {
  if (!isJpegSignature(jpeg)) {
    throw new Error("JPEG シグネチャが不正");
  }
  for (let i = jpeg.byteLength - 2; i >= 2; i--) {
    if (jpeg[i] === 0xff && jpeg[i + 1] === 0xd9) {
      return i;
    }
  }
  throw new Error("EOI マーカーが見つかりません");
}

function buildComSegments(totalBytes: number): Uint8Array {
  if (totalBytes === 0) {
    return new Uint8Array(0);
  }
  if (totalBytes < 4) {
    throw new Error(
      `JPEG パディング残り ${totalBytes} バイトは COM セグメントに収まらない`,
    );
  }

  const parts: Uint8Array[] = [];
  let remaining = totalBytes;
  const marker = utf8("chobitfile-padding");

  while (remaining > 0) {
    if (remaining < 4) {
      throw new Error(
        `JPEG COM 分割後の残り ${remaining} バイトを処理できません`,
      );
    }
    // 残りが 4..MAX+4 なら 1 セグメント、それ以上なら最大長
    let dataLen: number;
    if (remaining <= MAX_COM_DATA + 4) {
      dataLen = remaining - 4;
    } else {
      dataLen = MAX_COM_DATA;
      // 次の残りが 1..3 になると破綻するので、端数を先のセグメントに寄せる
      const after = remaining - 4 - dataLen;
      if (after > 0 && after < 4) {
        dataLen -= 4 - after;
      }
    }

    const seg = new Uint8Array(4 + dataLen);
    seg[0] = 0xff;
    seg[1] = 0xfe;
    const lengthField = dataLen + 2;
    seg[2] = (lengthField >>> 8) & 0xff;
    seg[3] = lengthField & 0xff;
    if (marker.byteLength <= dataLen) {
      seg.set(marker, 4);
    }
    parts.push(seg);
    remaining -= seg.byteLength;
  }

  return concatBytes(parts);
}

/**
 * 有効なベース JPEG を、EOI 直前の COM セグメントで
 * 目標バイト数ちょうどに伸ばす。
 */
export function generateJpeg(
  targetBytes: number,
  baseJpeg?: Uint8Array,
): Uint8Array {
  if (!Number.isInteger(targetBytes) || targetBytes <= 0) {
    throw new Error(`不正な目標サイズ: ${targetBytes}`);
  }

  const base = baseJpeg ?? buildMinimalJpeg();
  const eoiOffset = findEoiOffset(base);
  const head = base.subarray(0, eoiOffset);
  const paddingLen = targetBytes - head.byteLength - EOI.byteLength;

  if (paddingLen < 0) {
    throw new Error(
      `目標サイズ ${targetBytes} はベース JPEG（${head.byteLength + EOI.byteLength}）より小さい`,
    );
  }

  const padding = buildComSegments(paddingLen);
  const out = concatBytes([head, padding, EOI]);

  if (out.byteLength !== targetBytes) {
    throw new Error(
      `JPEG サイズ不一致: expected ${targetBytes}, got ${out.byteLength}`,
    );
  }
  return out;
}

/**
 * OffscreenCanvas でサイズ情報を描画した小さな JPEG を返す。
 * Canvas が使えない環境（Node テスト等）では最小 1×1 JPEG にフォールバックする。
 */
export async function renderLabeledJpeg(
  label: ImageLabel,
): Promise<Uint8Array> {
  const rendered = await renderLabeledImage(label, "image/jpeg");
  return rendered ?? buildMinimalJpeg();
}

/**
 * サイズ文字列入りプレビュー JPEG を描画し、目標バイト数までパディングする。
 */
export async function generateLabeledJpeg(
  targetBytes: number,
  label: ImageLabel,
): Promise<Uint8Array> {
  const base = await renderLabeledJpeg(label);
  return generateJpeg(targetBytes, base);
}

export function isJpegSignature(data: Uint8Array): boolean {
  return data.byteLength >= 2 && data[0] === 0xff && data[1] === 0xd8;
}

export function hasJpegEoi(data: Uint8Array): boolean {
  return (
    data.byteLength >= 2 &&
    data[data.byteLength - 2] === 0xff &&
    data[data.byteLength - 1] === 0xd9
  );
}
