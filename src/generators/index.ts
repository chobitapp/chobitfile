import type { FileType } from "../lib/types";
import { generateCsv } from "./csv";
import { generateDocx } from "./docx";
import type { ImageLabel } from "./image-label";
import { generateJpeg, generateLabeledJpeg } from "./jpeg";
import { generateJson } from "./json";
import { generatePdf } from "./pdf";
import { generateLabeledPng, generatePng } from "./png";
import { generatePptx } from "./pptx";
import { generateTxt } from "./txt";
import { generateXlsx } from "./xlsx";

export type GenerateFileOptions = {
  /** PNG / JPEG プレビューに描くラベル。省略時は最小 1×1 */
  imageLabel?: ImageLabel;
};

export async function generateFile(
  type: FileType,
  targetBytes: number,
  options?: GenerateFileOptions,
): Promise<Uint8Array> {
  switch (type) {
    case "png":
      if (options?.imageLabel) {
        return generateLabeledPng(targetBytes, options.imageLabel);
      }
      return generatePng(targetBytes);
    case "jpeg":
      if (options?.imageLabel) {
        return generateLabeledJpeg(targetBytes, options.imageLabel);
      }
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

export { generateCsv } from "./csv";
export { generateDocx } from "./docx";
export { type ImageLabel, imageLabelFromParams } from "./image-label";
export {
  buildMinimalJpeg,
  findEoiOffset,
  generateJpeg,
  generateLabeledJpeg,
  hasJpegEoi,
  isJpegSignature,
  renderLabeledJpeg,
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
  renderLabeledPng,
} from "./png";
export { generatePptx } from "./pptx";
export { generateTxt } from "./txt";
export { generateXlsx } from "./xlsx";
