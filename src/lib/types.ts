export const FILE_TYPES = [
  "png",
  "jpeg",
  "docx",
  "xlsx",
  "pptx",
  "pdf",
  "txt",
  "csv",
  "json",
] as const;
export type FileType = (typeof FILE_TYPES)[number];

export const SIZE_MB_OPTIONS = [1, 3, 5, 10, 20] as const;
export type SizeMb = (typeof SIZE_MB_OPTIONS)[number];

export const BOUNDARY_MODES = ["exact", "under", "over"] as const;
export type BoundaryMode = (typeof BOUNDARY_MODES)[number];

export type GeneratorParams = {
  type: FileType;
  sizeMb: SizeMb;
  boundary: BoundaryMode;
};

export const MIME_TYPES: Record<FileType, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  pdf: "application/pdf",
  txt: "text/plain;charset=utf-8",
  csv: "text/csv;charset=utf-8",
  json: "application/json",
};

/** UI 表示用ラベル */
export const FILE_TYPE_LABELS: Record<FileType, string> = {
  png: "PNG",
  jpeg: "JPEG",
  docx: "DOCX",
  xlsx: "XLSX",
  pptx: "PPTX",
  pdf: "PDF",
  txt: "TXT",
  csv: "CSV",
  json: "JSON",
};

export const DEFAULT_PARAMS: GeneratorParams = {
  type: "png",
  sizeMb: 1,
  boundary: "exact",
};
