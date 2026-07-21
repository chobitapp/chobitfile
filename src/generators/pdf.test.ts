import { describe, expect, it } from "vitest";
import { targetBytesFor } from "../lib/sizes";
import { generatePdf, hasPdfEof, isPdfSignature } from "./pdf";

describe("generatePdf", () => {
  it.each([
    [1, "exact"] as const,
    [1, "under"] as const,
    [1, "over"] as const,
    [3, "exact"] as const,
  ])("%sMB %s で目標バイト数ちょうど", (sizeMb, boundary) => {
    const target = targetBytesFor(sizeMb, boundary);
    const pdf = generatePdf(target);
    expect(pdf.byteLength).toBe(target);
    expect(isPdfSignature(pdf)).toBe(true);
    expect(hasPdfEof(pdf)).toBe(true);

    const asText = new TextDecoder("latin1").decode(pdf);
    expect(asText.includes("/Type /Catalog")).toBe(true);
    expect(asText.includes("xref")).toBe(true);
    expect(asText.includes("startxref")).toBe(true);
    expect(asText.includes("chobitfile-padding")).toBe(true);
  });

  it("小さすぎる目標サイズはエラー", () => {
    expect(() => generatePdf(64)).toThrow(/より小さい/);
  });
});
