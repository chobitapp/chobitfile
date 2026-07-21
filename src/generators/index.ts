import type { BoundaryMode, FileType, SizeMb } from "../lib/types";
import { generateCsv } from "./csv";
import { generateDocx } from "./docx";
import { generateJpeg } from "./jpeg";
import { generateJson } from "./json";
import { generatePdf } from "./pdf";
import { generateLabeledPng, generatePng, type PngLabel } from "./png";
import { generatePptx } from "./pptx";
import { generateTxt } from "./txt";
import { generateXlsx } from "./xlsx";

export type GenerateFileOptions = {
  /** PNG プレビューに描くラベル。省略時は最小 1×1 */
  pngLabel?: PngLabel;
};

export async function generateFile(
  type: FileType,
  targetBytes: number,
  options?: GenerateFileOptions,
): Promise<Uint8Array> {
  switch (type) {
    case "png":
      if (options?.pngLabel) {
        return generateLabeledPng(targetBytes, options.pngLabel);
      }
      return generatePng(targetBytes);
    case "jpeg":
      return generateJpeg(targetBytes);
    case "docx":
      return generateDocx(targetBytes);
    case "xlsx":
      return generateXlsx(targetBytes);
    case "pptx":
      return generatePptx(targetBytes);
    case "pdf":
      return generatePdf(targetBytes);
    case "txt":
      return generateTxt(targetBytes);
    case "csv":
      return generateCsv(targetBytes);
    case "json":
      return generateJson(targetBytes);
  }
}

export function pngLabelFromParams(
  sizeMb: SizeMb,
  boundary: BoundaryMode,
  targetBytes: number,
): PngLabel {
  return { sizeMb, boundary, targetBytes };
}

export { generateCsv } from "./csv";
export { generateDocx } from "./docx";
export {
  buildMinimalJpeg,
  findEoiOffset,
  generateJpeg,
  hasJpegEoi,
  isJpegSignature,
} from "./jpeg";
export { generateJson } from "./json";
export { isZipLocalHeader } from "./ooxml";
export {
  generatePdf,
  hasPdfEof,
  isPdfSignature,
} from "./pdf";
export {
  buildMinimalPng,
  findIendOffset,
  generateLabeledPng,
  generatePng,
  isPngSignature,
  type PngLabel,
  renderLabeledPng,
} from "./png";
export { generatePptx } from "./pptx";
export { generateTxt } from "./txt";
export { generateXlsx } from "./xlsx";
