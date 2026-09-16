import { DEFAULT_LOCALE, LOCALES, type Locale } from "../i18n/locales";

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

export const SIZE_MB_OPTIONS = [1, 3, 5, 10, 20, 50, 100] as const;
export type SizeMb = (typeof SIZE_MB_OPTIONS)[number];

export const BOUNDARY_MODES = ["exact", "under", "over"] as const;
export type BoundaryMode = (typeof BOUNDARY_MODES)[number];

export const GENERATE_MODES = ["size", "bulk"] as const;
export type GenerateMode = (typeof GENERATE_MODES)[number];

export { LOCALES, type Locale };

export type GeneratorParams = {
  type: FileType;
  sizeMb: SizeMb;
  boundary: BoundaryMode;
};

/** Web UI の URL 同期状態（生成パラメータ + 言語 + モード） */
export type AppParams = GeneratorParams & {
  lang: Locale;
  mode: GenerateMode;
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

export const DEFAULT_GENERATOR_PARAMS: GeneratorParams = {
  type: "png",
  sizeMb: 1,
  boundary: "exact",
};

/** 大量生成のファイル名モード */
export const BULK_NAME_MODES = ["sequential", "random"] as const;
export type BulkNameMode = (typeof BULK_NAME_MODES)[number];

/** ランダムファイル名の語彙ロケール（人名ではなく単語組み合わせ） */
export const BULK_NAME_LOCALES = ["en", "ja"] as const;
export type BulkNameLocale = (typeof BULK_NAME_LOCALES)[number];

/** 大量生成 UI 用デフォルト（URL 同期対象外・ローカル state） */
export const DEFAULT_BULK_COUNT = 1000;
export const DEFAULT_BULK_TYPES: readonly FileType[] = FILE_TYPES;
/** ディレクトリ配置のデフォルト（オフ） */
export const DEFAULT_BULK_DIRECTORIES = false;
export const DEFAULT_BULK_NAME_MODE: BulkNameMode = "sequential";
export const DEFAULT_BULK_NAME_LOCALE: BulkNameLocale = "en";
export const BULK_COUNT_MIN = 1;
export const BULK_COUNT_MAX = 10_000;
/** ディレクトリ配置時の最大階層（ルート直下を 0 とする） */
export const BULK_DIR_MAX_DEPTH = 2;

/** @deprecated 互換用。DEFAULT_GENERATOR_PARAMS を使う */
export const DEFAULT_PARAMS = DEFAULT_GENERATOR_PARAMS;

export const DEFAULT_APP_PARAMS: AppParams = {
  ...DEFAULT_GENERATOR_PARAMS,
  lang: DEFAULT_LOCALE,
  mode: "size",
};
