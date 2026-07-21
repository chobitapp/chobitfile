import type { BoundaryMode, FileType, SizeMb } from "../lib/types";
import { generateDocx } from "./docx";
import { generateLabeledPng, generatePng, type PngLabel } from "./png";

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
    case "docx":
      return generateDocx(targetBytes);
  }
}

export function pngLabelFromParams(
  sizeMb: SizeMb,
  boundary: BoundaryMode,
  targetBytes: number,
): PngLabel {
  return { sizeMb, boundary, targetBytes };
}

export { generateDocx, isZipLocalHeader } from "./docx";
export {
  buildMinimalPng,
  findIendOffset,
  generateLabeledPng,
  generatePng,
  isPngSignature,
  type PngLabel,
  renderLabeledPng,
} from "./png";
