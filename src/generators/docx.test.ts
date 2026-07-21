import { describe, expect, it } from "vitest";
import { targetBytesFor } from "../lib/sizes";
import { generateDocx, isZipLocalHeader } from "./docx";

describe("generateDocx", () => {
  it.each([
    [1, "exact"] as const,
    [1, "under"] as const,
    [1, "over"] as const,
    [3, "exact"] as const,
  ])("%sMB %s で目標バイト数ちょうど", (sizeMb, boundary) => {
    const target = targetBytesFor(sizeMb, boundary);
    const docx = generateDocx(target);
    expect(docx.byteLength).toBe(target);
    expect(isZipLocalHeader(docx)).toBe(true);

    const asText = new TextDecoder("latin1").decode(docx);
    expect(asText.includes("word/document.xml")).toBe(true);
    expect(asText.includes("[Content_Types].xml")).toBe(true);
    expect(asText.includes("word/padding.bin")).toBe(true);
  });
});
