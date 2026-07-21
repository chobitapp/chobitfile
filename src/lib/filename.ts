import type { BoundaryMode, FileType, SizeMb } from "./types";

export function buildFilename(
  type: FileType,
  sizeMb: SizeMb,
  boundary: BoundaryMode,
): string {
  return `chobitfile-${sizeMb}mb-${boundary}.${type}`;
}
