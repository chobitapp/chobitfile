import {
  BOUNDARY_MODES,
  type BoundaryMode,
  BULK_COUNT_MAX,
  BULK_COUNT_MIN,
  FILE_TYPES,
  type FileType,
  SIZE_MB_OPTIONS,
  type SizeMb,
} from "./types";

const SIZE_LABELS = SIZE_MB_OPTIONS.join("|");
const BOUNDARY_LABELS = BOUNDARY_MODES.join("|");
const TYPE_LABELS = FILE_TYPES.join("|");

/** アプリが生成するダウンロード名の形式（サイズ指定） */
export const FILENAME_PATTERN = new RegExp(
  `^chobitfile-(${SIZE_LABELS})mb-(${BOUNDARY_LABELS})\\.(${TYPE_LABELS})$`,
);

/** 大量生成 ZIP のダウンロード名 */
export const BULK_ZIP_FILENAME_PATTERN = /^chobitfile-bulk-(\d+)\.zip$/;

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

export function buildBulkZipFilename(count: number): string {
  return `chobitfile-bulk-${count}.zip`;
}

export function isValidBulkZipFilename(filename: string): boolean {
  const match = BULK_ZIP_FILENAME_PATTERN.exec(filename);
  if (!match) return false;
  const count = Number(match[1]);
  return (
    Number.isInteger(count) &&
    count >= BULK_COUNT_MIN &&
    count <= BULK_COUNT_MAX
  );
}
