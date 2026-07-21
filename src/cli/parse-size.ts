const KIB = 1024;
const MIB = 1024 * 1024;

/**
 * Parse a CLI size string to bytes (1024-based).
 *
 * Accepted examples:
 * - `12345` → 12345 bytes
 * - `512k` / `512kb` → 512 * 1024
 * - `10m` / `10mb` → 10 * 1024 * 1024
 *
 * Fractions and SI (1000-based) are rejected.
 */
export function parseSizeToBytes(raw: string): number {
  const s = raw.trim().toLowerCase();
  if (s.length === 0) {
    throw new Error("Size is empty");
  }

  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if (!Number.isSafeInteger(n) || n <= 0) {
      throw new Error(`Invalid size: ${raw}`);
    }
    return n;
  }

  const match = /^(\d+)(k|kb|m|mb)$/.exec(s);
  if (!match) {
    throw new Error(
      `Invalid size: ${raw} (examples: 1048576 / 512kb / 10mb; 1024-based integers only)`,
    );
  }

  const value = Number(match[1]);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Invalid size: ${raw}`);
  }

  const unit = match[2];
  const bytes = unit === "k" || unit === "kb" ? value * KIB : value * MIB;
  if (!Number.isSafeInteger(bytes) || bytes <= 0) {
    throw new Error(`Size is too large: ${raw}`);
  }
  return bytes;
}

/** Whether a string like `10mb` means exactly N MiB (for filenames). */
export function tryParseWholeMibLabel(raw: string): number | null {
  const s = raw.trim().toLowerCase();
  const match = /^(\d+)(m|mb)$/.exec(s);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
}
