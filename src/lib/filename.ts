import {
  BOUNDARY_MODES,
  type BoundaryMode,
  FILE_TYPES,
  type FileType,
  SIZE_MB_OPTIONS,
  type SizeMb,
} from "./types";

const SIZE_LABELS = SIZE_MB_OPTIONS.join("|");
const BOUNDARY_LABELS = BOUNDARY_MODES.join("|");
const TYPE_LABELS = FILE_TYPES.join("|");

/** アプリが生成するダウンロード名の形式 */
export const FILENAME_PATTERN = new RegExp(
  `^chobitfile-(${SIZE_LABELS})mb-(${BOUNDARY_LABELS})\\.(${TYPE_LABELS})$`,
);

export function buildFilename(
  type: FileType,
  sizeMb: SizeMb,
  boundary: BoundaryMode,
): string {
  return `chobitfile-${sizeMb}mb-${boundary}.${type}`;
}

export function isValidFilename(filename: string): boolean {
  return FILENAME_PATTERN.test(filename);
}
