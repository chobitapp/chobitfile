import { concatBytes, utf8, writeU32BE } from "../lib/bytes";
import { crc32 } from "../lib/crc32";

const PNG_SIGNATURE = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const PADDING_CHUNK_TYPE = "chBk";

function adler32(data: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

/** zlib ラップ + deflate store ブロック（無圧縮） */
function zlibStore(raw: Uint8Array): Uint8Array {
  const len = raw.byteLength;
  if (len > 0xffff) {
    throw new Error("zlib store ブロックは 65535 バイトまで");
  }
  const out = new Uint8Array(2 + 5 + len + 4);
  out[0] = 0x78;
  out[1] = 0x01;
  // BFINAL=1, BTYPE=00
  out[2] = 0x01;
  out[3] = len & 0xff;
  out[4] = (len >>> 8) & 0xff;
  out[5] = ~len & 0xff;
  out[6] = (~len >>> 8) & 0xff;
  out.set(raw, 7);
  const view = new DataView(out.buffer);
  writeU32BE(view, 7 + len, adler32(raw));
  return out;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = utf8(type);
  if (typeBytes.byteLength !== 4) {
    throw new Error(`PNG チャンク type は 4 文字: ${type}`);
  }
  const out = new Uint8Array(12 + data.byteLength);
  const view = new DataView(out.buffer);
  writeU32BE(view, 0, data.byteLength);
  out.set(typeBytes, 4);
  out.set(data, 8);
  const crcInput = concatBytes([typeBytes, data]);
  writeU32BE(view, 8 + data.byteLength, crc32(crcInput));
  return out;
}

/** 1×1 RGB の最小有効 PNG 本体（IEND 直前まで） */
function buildMinimalPngBody(): Uint8Array {
  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  writeU32BE(ihdrView, 0, 1); // width
  writeU32BE(ihdrView, 4, 1); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // filter=None + R G B
  const scanline = new Uint8Array([0, 0x20, 0x80, 0xc0]);
  const idat = zlibStore(scanline);

  return concatBytes([
    PNG_SIGNATURE,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
  ]);
}

const IEND = pngChunk("IEND", new Uint8Array(0));

/**
 * 目標バイト数ちょうどになる有効 PNG を生成する。
 * 余りは private ancillary チャンク `chBk` で埋める。
 */
export function generatePng(targetBytes: number): Uint8Array {
  if (!Number.isInteger(targetBytes) || targetBytes <= 0) {
    throw new Error(`不正な目標サイズ: ${targetBytes}`);
  }

  const head = buildMinimalPngBody();
  const fixed = head.byteLength + IEND.byteLength;
  // チャンク: length(4) + type(4) + data + crc(4)
  const chunkOverhead = 12;
  const paddingDataLen = targetBytes - fixed - chunkOverhead;

  if (paddingDataLen < 0) {
    throw new Error(
      `目標サイズ ${targetBytes} は最小 PNG（${fixed + chunkOverhead}）より小さい`,
    );
  }

  const paddingData = new Uint8Array(paddingDataLen);
  // 先頭に識別子を入れてデバッグしやすくする（残りは 0）
  const marker = utf8("chobitfile-padding");
  if (marker.byteLength <= paddingDataLen) {
    paddingData.set(marker, 0);
  }

  const paddingChunk = pngChunk(PADDING_CHUNK_TYPE, paddingData);
  const out = concatBytes([head, paddingChunk, IEND]);

  if (out.byteLength !== targetBytes) {
    throw new Error(
      `PNG サイズ不一致: expected ${targetBytes}, got ${out.byteLength}`,
    );
  }
  return out;
}

export function isPngSignature(data: Uint8Array): boolean {
  if (data.byteLength < PNG_SIGNATURE.byteLength) return false;
  for (let i = 0; i < PNG_SIGNATURE.byteLength; i++) {
    if (data[i] !== PNG_SIGNATURE[i]) return false;
  }
  return true;
}
