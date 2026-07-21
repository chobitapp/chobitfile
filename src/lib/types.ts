export const FILE_TYPES = ["png", "docx"] as const;
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
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export const DEFAULT_PARAMS: GeneratorParams = {
  type: "png",
  sizeMb: 1,
  boundary: "exact",
};
