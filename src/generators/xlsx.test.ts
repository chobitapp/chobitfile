import { describe, expect, it } from "vitest";
import { targetBytesFor } from "../lib/sizes";
import { isZipLocalHeader } from "./ooxml";
import { generateXlsx } from "./xlsx";

describe("generateXlsx", () => {
  it.each([
    [1, "exact"] as const,
    [1, "under"] as const,
    [1, "over"] as const,
    [3, "exact"] as const,
  ])("%sMB %s で目標バイト数ちょうど", (sizeMb, boundary) => {
    const target = targetBytesFor(sizeMb, boundary);
    const xlsx = generateXlsx(target);
    expect(xlsx.byteLength).toBe(target);
    expect(isZipLocalHeader(xlsx)).toBe(true);

    const asText = new TextDecoder("latin1").decode(xlsx);
    expect(asText.includes("xl/workbook.xml")).toBe(true);
    expect(asText.includes("[Content_Types].xml")).toBe(true);
    expect(asText.includes("xl/worksheets/sheet1.xml")).toBe(true);
    expect(asText.includes("xl/padding.bin")).toBe(true);
  });
});
