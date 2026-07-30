import type { ImageLabel } from "../generators";
import { isLocale, type Locale } from "../i18n/locales";
import { isValidBulkZipFilename, isValidFilename } from "../lib/filename";
import { MAX_TARGET_BYTES } from "../lib/sizes";
import {
  BOUNDARY_MODES,
  type BoundaryMode,
  BULK_COUNT_MAX,
  BULK_COUNT_MIN,
  BULK_NAME_LOCALES,
  BULK_NAME_MODES,
  type BulkNameLocale,
  type BulkNameMode,
  DEFAULT_BULK_NAME_LOCALE,
  DEFAULT_BULK_NAME_MODE,
  FILE_TYPES,
  type FileType,
  SIZE_MB_OPTIONS,
  type SizeMb,
} from "../lib/types";

export type GenerateRequest = {
  mode?: "single";
  type: FileType;
  targetBytes: number;
  filename: string;
  /** Label drawn into PNG / JPEG previews */
  imageLabel?: ImageLabel;
};

export type BulkGenerateRequest = {
  mode: "bulk";
  count: number;
  types: FileType[];
  filename: string;
  /** 最大2階層までのディレクトリにランダム配置（省略時 false） */
  directories?: boolean;
  /** ファイル名モード（省略時 sequential） */
  nameMode?: BulkNameMode;
  /** ランダム名の語彙ロケール（省略時 en） */
  nameLocale?: BulkNameLocale;
};

export type WorkerRequest = GenerateRequest | BulkGenerateRequest;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFileType(value: unknown): value is FileType {
  return (
    typeof value === "string" &&
    (FILE_TYPES as readonly string[]).includes(value)
  );
}

function isSizeMb(value: unknown): value is SizeMb {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    (SIZE_MB_OPTIONS as readonly number[]).includes(value)
  );
}

function isBoundaryMode(value: unknown): value is BoundaryMode {
  return (
    typeof value === "string" &&
    (BOUNDARY_MODES as readonly string[]).includes(value)
  );
}

function parseImageLabel(value: unknown): ImageLabel | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) {
    throw new Error("Invalid imageLabel");
  }
  const { sizeMb, boundary, targetBytes, locale } = value;
  if (!isSizeMb(sizeMb)) {
    throw new Error(`Invalid imageLabel.sizeMb: ${String(sizeMb)}`);
  }
  if (!isBoundaryMode(boundary)) {
    throw new Error(`Invalid imageLabel.boundary: ${String(boundary)}`);
  }
  if (
    typeof targetBytes !== "number" ||
    !Number.isInteger(targetBytes) ||
    targetBytes <= 0 ||
    targetBytes > MAX_TARGET_BYTES
  ) {
    throw new Error(`Invalid imageLabel.targetBytes: ${String(targetBytes)}`);
  }
  let resolvedLocale: Locale = "ja";
  if (locale !== undefined) {
    if (typeof locale !== "string" || !isLocale(locale)) {
      throw new Error(`Invalid imageLabel.locale: ${String(locale)}`);
    }
    resolvedLocale = locale;
  }
  return { sizeMb, boundary, targetBytes, locale: resolvedLocale };
}

function parseBulkTypes(value: unknown): FileType[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Bulk types must be a non-empty array");
  }
  const types: FileType[] = [];
  const seen = new Set<FileType>();
  for (const item of value) {
    if (!isFileType(item)) {
      throw new Error(`Invalid bulk type: ${String(item)}`);
    }
    if (!seen.has(item)) {
      seen.add(item);
      types.push(item);
    }
  }
  return types;
}

/**
 * Validate Worker postMessage payload for single-file generation.
 * Rejects bad type / oversized targetBytes / unexpected filename.
 */
export function parseGenerateRequest(data: unknown): GenerateRequest {
  if (!isRecord(data)) {
    throw new Error("Request must be an object");
  }

  if (data.mode === "bulk") {
    throw new Error("Expected single generate request");
  }

  const { type, targetBytes, filename, imageLabel } = data;

  if (!isFileType(type)) {
    throw new Error(`Invalid type: ${String(type)}`);
  }

  if (
    typeof targetBytes !== "number" ||
    !Number.isInteger(targetBytes) ||
    targetBytes <= 0 ||
    targetBytes > MAX_TARGET_BYTES
  ) {
    throw new Error(
      `Invalid target size: ${String(targetBytes)} (integer 1..${MAX_TARGET_BYTES})`,
    );
  }

  if (typeof filename !== "string" || !isValidFilename(filename)) {
    throw new Error(`Invalid filename: ${String(filename)}`);
  }

  const parsedLabel = parseImageLabel(imageLabel);
  if (parsedLabel !== undefined && type !== "png" && type !== "jpeg") {
    throw new Error("imageLabel is only allowed for PNG / JPEG");
  }

  return {
    mode: "single",
    type,
    targetBytes,
    filename,
    imageLabel: parsedLabel,
  };
}

export function parseBulkGenerateRequest(data: unknown): BulkGenerateRequest {
  if (!isRecord(data)) {
    throw new Error("Request must be an object");
  }
  if (data.mode !== "bulk") {
    throw new Error("Expected bulk generate request");
  }

  const { count, types, filename, directories, nameMode, nameLocale } = data;

  if (
    typeof count !== "number" ||
    !Number.isInteger(count) ||
    count < BULK_COUNT_MIN ||
    count > BULK_COUNT_MAX
  ) {
    throw new Error(
      `Invalid bulk count: ${String(count)} (integer ${BULK_COUNT_MIN}..${BULK_COUNT_MAX})`,
    );
  }

  const parsedTypes = parseBulkTypes(types);

  if (typeof filename !== "string" || !isValidBulkZipFilename(filename)) {
    throw new Error(`Invalid bulk filename: ${String(filename)}`);
  }

  if (directories !== undefined && typeof directories !== "boolean") {
    throw new Error(`Invalid bulk directories: ${String(directories)}`);
  }

  let resolvedNameMode: BulkNameMode = DEFAULT_BULK_NAME_MODE;
  if (nameMode !== undefined) {
    if (
      typeof nameMode !== "string" ||
      !(BULK_NAME_MODES as readonly string[]).includes(nameMode)
    ) {
      throw new Error(`Invalid bulk nameMode: ${String(nameMode)}`);
    }
    resolvedNameMode = nameMode as BulkNameMode;
  }

  let resolvedNameLocale: BulkNameLocale = DEFAULT_BULK_NAME_LOCALE;
  if (nameLocale !== undefined) {
    if (
      typeof nameLocale !== "string" ||
      !(BULK_NAME_LOCALES as readonly string[]).includes(nameLocale)
    ) {
      throw new Error(`Invalid bulk nameLocale: ${String(nameLocale)}`);
    }
    resolvedNameLocale = nameLocale as BulkNameLocale;
  }

  return {
    mode: "bulk",
    count,
    types: parsedTypes,
    filename,
    directories: directories === true,
    nameMode: resolvedNameMode,
    nameLocale: resolvedNameLocale,
  };
}

/** Single / bulk を判別して検証する */
export function parseWorkerRequest(data: unknown): WorkerRequest {
  if (!isRecord(data)) {
    throw new Error("Request must be an object");
  }
  if (data.mode === "bulk") {
    return parseBulkGenerateRequest(data);
  }
  return parseGenerateRequest(data);
}
