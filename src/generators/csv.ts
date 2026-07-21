import { utf8 } from "../lib/bytes";

const PAD_BYTE = 0x78; // 'x' — カンマ・引用符・改行を含まない

/**
 * 目標バイト数ちょうどになる最小有効 CSV を生成する。
 * ヘッダ + 1 行（パディング列）構成。
 */
export function generateCsv(targetBytes: number): Uint8Array {
  if (!Number.isInteger(targetBytes) || targetBytes <= 0) {
    throw new Error(`不正な目標サイズ: ${targetBytes}`);
  }

  const prefix = utf8("id,name,note\n1,chobitfile,");
  const suffix = utf8("\n");
  const paddingLen = targetBytes - prefix.byteLength - suffix.byteLength;

  if (paddingLen < 0) {
    throw new Error(
      `目標サイズ ${targetBytes} は最小 CSV（${prefix.byteLength + suffix.byteLength}）より小さい`,
    );
  }

  const out = new Uint8Array(targetBytes);
  out.set(prefix, 0);
  out.fill(PAD_BYTE, prefix.byteLength, prefix.byteLength + paddingLen);
  out.set(suffix, prefix.byteLength + paddingLen);
  return out;
}
