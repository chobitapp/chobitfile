import { utf8 } from "../lib/bytes";

const PAD_BYTE = 0x78; // 'x' — JSON 文字列内でエスケープ不要

/**
 * 目標バイト数ちょうどになる最小有効 JSON オブジェクトを生成する。
 * padding フィールドの文字列長でサイズを合わせる。
 */
export function generateJson(targetBytes: number): Uint8Array {
  if (!Number.isInteger(targetBytes) || targetBytes <= 0) {
    throw new Error(`不正な目標サイズ: ${targetBytes}`);
  }

  const prefix = utf8('{"app":"chobitfile","padding":"');
  const suffix = utf8('"}');
  const paddingLen = targetBytes - prefix.byteLength - suffix.byteLength;

  if (paddingLen < 0) {
    throw new Error(
      `目標サイズ ${targetBytes} は最小 JSON（${prefix.byteLength + suffix.byteLength}）より小さい`,
    );
  }

  const out = new Uint8Array(targetBytes);
  out.set(prefix, 0);
  out.fill(PAD_BYTE, prefix.byteLength, prefix.byteLength + paddingLen);
  out.set(suffix, prefix.byteLength + paddingLen);
  return out;
}
