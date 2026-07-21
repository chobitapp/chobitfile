import type { ImageLabel } from "../generators";
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
  /** PNG / JPEG のときプレビューに描くラベル */
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
    throw new Error("imageLabel が不正です");
  }
  const { sizeMb, boundary, targetBytes } = value;
  if (!isSizeMb(sizeMb)) {
    throw new Error(`imageLabel.sizeMb が不正です: ${String(sizeMb)}`);
  }
  if (!isBoundaryMode(boundary)) {
    throw new Error(`imageLabel.boundary が不正です: ${String(boundary)}`);
  }
  if (
    typeof targetBytes !== "number" ||
    !Number.isInteger(targetBytes) ||
    targetBytes <= 0 ||
    targetBytes > MAX_TARGET_BYTES
  ) {
    throw new Error(
      `imageLabel.targetBytes が不正です: ${String(targetBytes)}`,
    );
  }
  return { sizeMb, boundary, targetBytes };
}

/**
 * Worker が受け取る postMessage データを検証する。
 * 不正な type / 過大な targetBytes / 想定外の filename を拒否する。
 */
export function parseGenerateRequest(data: unknown): GenerateRequest {
  if (!isRecord(data)) {
    throw new Error("リクエストがオブジェクトではありません");
  }

  const { type, targetBytes, filename, imageLabel } = data;

  if (!isFileType(type)) {
    throw new Error(`不正な形式: ${String(type)}`);
  }

  if (
    typeof targetBytes !== "number" ||
    !Number.isInteger(targetBytes) ||
    targetBytes <= 0 ||
    targetBytes > MAX_TARGET_BYTES
  ) {
    throw new Error(
      `不正な目標サイズ: ${String(targetBytes)}（1〜${MAX_TARGET_BYTES} の整数）`,
    );
  }

  if (typeof filename !== "string" || !isValidFilename(filename)) {
    throw new Error(`不正なファイル名: ${String(filename)}`);
  }

  const parsedLabel = parseImageLabel(imageLabel);
  if (parsedLabel !== undefined && type !== "png" && type !== "jpeg") {
    throw new Error("imageLabel は PNG / JPEG のみ指定できます");
  }

  return {
    type,
    targetBytes,
    filename,
    imageLabel: parsedLabel,
  };
}
