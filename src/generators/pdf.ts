import { utf8 } from "../lib/bytes";

function pad10(n: number): string {
  return String(n).padStart(10, "0");
}

function xrefEntry(offset: number, generation: number, inUse: boolean): string {
  const flag = inUse ? "n" : "f";
  // 各エントリはちょうど 20 バイト（末尾 \n 込み）
  return `${pad10(offset)} ${String(generation).padStart(5, "0")} ${flag} \n`;
}

/**
 * 目標バイト数ちょうどになる最小有効 PDF を生成する。
 * 余りは未使用ストリームオブジェクトの内容で埋める。
 *
 * オフセット・Length・startxref は固定桁（10 桁）で組み立て、
 * パディング長の桁数変化による再計算を避ける。
 */
export function generatePdf(targetBytes: number): Uint8Array {
  if (!Number.isInteger(targetBytes) || targetBytes <= 0) {
    throw new Error(`不正な目標サイズ: ${targetBytes}`);
  }

  // ヘッダ + バイナリコメント（PDF がバイナリ扱いになるよう非 ASCII を含める）
  const header = concatUtf8AndBytes(
    "%PDF-1.4\n",
    new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]),
  );

  const obj1 = utf8("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  const obj2 = utf8(
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
  );
  const obj3 = utf8(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n",
  );
  const obj4 = utf8("4 0 obj\n<< /Length 0 >>\nstream\nendstream\nendobj\n");

  // オブジェクト 5: パディングストリーム（Length は常に 10 桁）
  // `5 0 obj\n<< /Length NNNNNNNNNN >>\nstream\n` + data + `endstream\nendobj\n`
  const obj5HeadTemplate = "5 0 obj\n<< /Length 0000000000 >>\nstream\n";
  const obj5HeadLen = utf8(obj5HeadTemplate).byteLength;
  const obj5Tail = utf8("endstream\nendobj\n");

  const offsets = {
    obj1: header.byteLength,
    obj2: 0,
    obj3: 0,
    obj4: 0,
    obj5: 0,
    xref: 0,
  };
  offsets.obj2 = offsets.obj1 + obj1.byteLength;
  offsets.obj3 = offsets.obj2 + obj2.byteLength;
  offsets.obj4 = offsets.obj3 + obj3.byteLength;
  offsets.obj5 = offsets.obj4 + obj4.byteLength;

  // xref + trailer の固定長部分
  // xref\n0 6\n + 6 entries × 20 + trailer with fixed-width startxref
  const xrefHeader = utf8("xref\n0 6\n");
  const xrefEntriesLen = 6 * 20;
  const trailerWithoutStart = utf8(
    "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n",
  );
  const startxrefLine = utf8(`${"0".repeat(10)}\n`); // 固定 10 桁
  const eof = utf8("%%EOF\n");
  const tailFixedLen =
    xrefHeader.byteLength +
    xrefEntriesLen +
    trailerWithoutStart.byteLength +
    startxrefLine.byteLength +
    eof.byteLength;

  const beforePadding = offsets.obj5 + obj5HeadLen;
  const afterPadding = obj5Tail.byteLength + tailFixedLen;
  const paddingLen = targetBytes - beforePadding - afterPadding;

  if (paddingLen < 0) {
    throw new Error(
      `目標サイズ ${targetBytes} は最小 PDF（${beforePadding + afterPadding}）より小さい`,
    );
  }

  const padding = new Uint8Array(paddingLen);
  const marker = utf8("chobitfile-padding");
  if (marker.byteLength <= paddingLen) {
    padding.set(marker, 0);
  }

  const obj5Head = utf8(
    `5 0 obj\n<< /Length ${pad10(paddingLen)} >>\nstream\n`,
  );
  if (obj5Head.byteLength !== obj5HeadLen) {
    throw new Error("PDF obj5 ヘッダ長が想定と異なります");
  }

  const xrefOffset =
    offsets.obj5 + obj5Head.byteLength + paddingLen + obj5Tail.byteLength;

  const xrefBody = utf8(
    xrefEntry(0, 65535, false) +
      xrefEntry(offsets.obj1, 0, true) +
      xrefEntry(offsets.obj2, 0, true) +
      xrefEntry(offsets.obj3, 0, true) +
      xrefEntry(offsets.obj4, 0, true) +
      xrefEntry(offsets.obj5, 0, true),
  );

  const startxref = utf8(`${pad10(xrefOffset)}\n`);

  const out = new Uint8Array(targetBytes);
  let o = 0;
  const write = (part: Uint8Array) => {
    out.set(part, o);
    o += part.byteLength;
  };

  write(header);
  write(obj1);
  write(obj2);
  write(obj3);
  write(obj4);
  write(obj5Head);
  write(padding);
  write(obj5Tail);
  write(xrefHeader);
  write(xrefBody);
  write(trailerWithoutStart);
  write(startxref);
  write(eof);

  if (o !== targetBytes) {
    throw new Error(`PDF サイズ不一致: expected ${targetBytes}, got ${o}`);
  }
  return out;
}

function concatUtf8AndBytes(text: string, bytes: Uint8Array): Uint8Array {
  const t = utf8(text);
  const out = new Uint8Array(t.byteLength + bytes.byteLength);
  out.set(t, 0);
  out.set(bytes, t.byteLength);
  return out;
}

export function isPdfSignature(data: Uint8Array): boolean {
  if (data.byteLength < 5) return false;
  return (
    data[0] === 0x25 && // %
    data[1] === 0x50 && // P
    data[2] === 0x44 && // D
    data[3] === 0x46 && // F
    data[4] === 0x2d // -
  );
}

export function hasPdfEof(data: Uint8Array): boolean {
  // 末尾付近に %%EOF があるか（改行の有無を許容）
  const tail = new TextDecoder("latin1").decode(
    data.subarray(Math.max(0, data.byteLength - 16)),
  );
  return tail.includes("%%EOF");
}
