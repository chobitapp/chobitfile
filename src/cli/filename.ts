import { buildFilename } from "../lib/filename";
import {
  type BoundaryMode,
  type FileType,
  SIZE_MB_OPTIONS,
  type SizeMb,
} from "../lib/types";

function isSizeMb(n: number): n is SizeMb {
  return (SIZE_MB_OPTIONS as readonly number[]).includes(n);
}

/**
 * CLI のデフォルト出力ファイル名。
 * Web プリセット（1/3/5/10/20 MB + boundary）は Web と同じパターン。
 * それ以外の整数 MiB + boundary は `chobitfile-{n}mb-{boundary}.{ext}`。
 * 任意バイト指定などは `chobitfile-{bytes}b.{ext}`。
 */
export function buildCliFilename(options: {
  type: FileType;
  targetBytes: number;
  boundary: BoundaryMode;
  /** --size で整数 MiB と解釈できたときのラベル（例: 2） */
  sizeMbLabel: number | null;
  /** --bytes で直接指定したか */
  fromBytesFlag: boolean;
}): string {
  const { type, targetBytes, boundary, sizeMbLabel, fromBytesFlag } = options;

  if (!fromBytesFlag && sizeMbLabel !== null && isSizeMb(sizeMbLabel)) {
    return buildFilename(type, sizeMbLabel, boundary);
  }

  if (!fromBytesFlag && sizeMbLabel !== null) {
    return `chobitfile-${sizeMbLabel}mb-${boundary}.${type}`;
  }

  return `chobitfile-${targetBytes}b.${type}`;
}
