import type { BoundaryMode, SizeMb } from "./types";

const MIB = 1024 * 1024;

/** 生成可能な最大目標バイト数（20 MB + 1） */
export const MAX_TARGET_BYTES = 20 * MIB + 1;

/** ラベル MB に対応するベースバイト数（1024 系） */
export function baseBytesForMb(sizeMb: SizeMb): number {
  return sizeMb * MIB;
}

/** 境界モードを適用した目標バイト数 */
export function targetBytesFor(sizeMb: SizeMb, boundary: BoundaryMode): number {
  const base = baseBytesForMb(sizeMb);
  switch (boundary) {
    case "exact":
      return base;
    case "under":
      return base - 1;
    case "over":
      return base + 1;
  }
}

export function formatBytes(bytes: number): string {
  return bytes.toLocaleString("ja-JP");
}

export function sizeOptionLabel(sizeMb: SizeMb): string {
  return `${sizeMb} MB（${formatBytes(baseBytesForMb(sizeMb))} バイト）`;
}
