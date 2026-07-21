import type { ImageLabel } from "../generators";
import { isLocale, type Locale } from "../i18n/locales";
import { isValidFilename } from "../lib/filename";
import { MAX_TARGET_BYTES } from "../lib/sizes";
import {
  BOUNDARY_MODES,
  type BoundaryMode,
  FILE_TYPES,
  type FileType,
  SIZE_MB_OPTIONS,
  type SizeMb,
} from "../lib/types";

export type GenerateRequest = {
  type: FileType;
  targetBytes: number;
  filename: string;
  /** Label drawn into PNG / JPEG previews */
  imageLabel?: ImageLabel;
};

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

/**
 * Validate Worker postMessage payload.
 * Rejects bad type / oversized targetBytes / unexpected filename.
 */
export function parseGenerateRequest(data: unknown): GenerateRequest {
  if (!isRecord(data)) {
    throw new Error("Request must be an object");
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
    type,
    targetBytes,
    filename,
    imageLabel: parsedLabel,
  };
}
