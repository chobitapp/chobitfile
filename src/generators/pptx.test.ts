import { describe, expect, it } from "vitest";
import { targetBytesFor } from "../lib/sizes";
import { isZipLocalHeader } from "./ooxml";
import { generatePptx } from "./pptx";

describe("generatePptx", () => {
  it.each([
    [1, "exact"] as const,
    [1, "under"] as const,
    [1, "over"] as const,
    [3, "exact"] as const,
  ])("%sMB %s で目標バイト数ちょうど", (sizeMb, boundary) => {
    const target = targetBytesFor(sizeMb, boundary);
    const pptx = generatePptx(target);
    expect(pptx.byteLength).toBe(target);
    expect(isZipLocalHeader(pptx)).toBe(true);

    const asText = new TextDecoder("latin1").decode(pptx);
    expect(asText.includes("ppt/presentation.xml")).toBe(true);
    expect(asText.includes("[Content_Types].xml")).toBe(true);
    expect(asText.includes("ppt/slides/slide1.xml")).toBe(true);
    expect(asText.includes("ppt/padding.bin")).toBe(true);
  });
});
