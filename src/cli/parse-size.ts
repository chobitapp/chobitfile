const KIB = 1024;
const MIB = 1024 * 1024;

/**
 * CLI のサイズ文字列をバイト数に変換する（1024 系）。
 *
 * 受け付ける例:
 * - `12345` → 12345 バイト
 * - `512k` / `512kb` → 512 * 1024
 * - `10m` / `10mb` → 10 * 1024 * 1024
 *
 * 小数・SI（1000 系）は受け付けない。
 */
export function parseSizeToBytes(raw: string): number {
  const s = raw.trim().toLowerCase();
  if (s.length === 0) {
    throw new Error("サイズが空です");
  }

  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if (!Number.isSafeInteger(n) || n <= 0) {
      throw new Error(`不正なサイズ: ${raw}`);
    }
    return n;
  }

  const match = /^(\d+)(k|kb|m|mb)$/.exec(s);
  if (!match) {
    throw new Error(
      `不正なサイズ: ${raw}（例: 1048576 / 512kb / 10mb。1024 系・整数のみ）`,
    );
  }

  const value = Number(match[1]);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`不正なサイズ: ${raw}`);
  }

  const unit = match[2];
  const bytes = unit === "k" || unit === "kb" ? value * KIB : value * MIB;
  if (!Number.isSafeInteger(bytes) || bytes <= 0) {
    throw new Error(`サイズが大きすぎます: ${raw}`);
  }
  return bytes;
}

/** `10mb` のような表記が「ちょうど N MiB」かどうか。ファイル名用。 */
export function tryParseWholeMibLabel(raw: string): number | null {
  const s = raw.trim().toLowerCase();
  const match = /^(\d+)(m|mb)$/.exec(s);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
}
