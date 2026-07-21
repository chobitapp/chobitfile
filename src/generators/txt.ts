import { utf8 } from "../lib/bytes";

const HEADER = "chobitfile dummy text\n";
const PAD_BYTE = 0x78; // 'x'

/**
 * 目標バイト数ちょうどになるプレーンテキストを生成する。
 */
export function generateTxt(targetBytes: number): Uint8Array {
  if (!Number.isInteger(targetBytes) || targetBytes <= 0) {
    throw new Error(`不正な目標サイズ: ${targetBytes}`);
  }

  const out = new Uint8Array(targetBytes);
  const header = utf8(HEADER);
  if (header.byteLength <= targetBytes) {
    out.set(header, 0);
    out.fill(PAD_BYTE, header.byteLength);
  } else {
    out.fill(PAD_BYTE);
  }
  return out;
}
