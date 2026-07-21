import type { FileType } from "../lib/types";
import { generateDocx } from "./docx";
import { generatePng } from "./png";

export function generateFile(type: FileType, targetBytes: number): Uint8Array {
  switch (type) {
    case "png":
      return generatePng(targetBytes);
    case "docx":
      return generateDocx(targetBytes);
  }
}

export { generateDocx, isZipLocalHeader } from "./docx";
export { generatePng, isPngSignature } from "./png";
