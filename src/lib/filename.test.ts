import { describe, expect, it } from "vitest";
import {
  buildBulkZipFilename,
  buildFilename,
  isValidBulkZipFilename,
  isValidFilename,
} from "./filename";

describe("filename", () => {
  it("仕様どおりの名前を返す", () => {
    expect(buildFilename("png", 10, "exact")).toBe("chobitfile-10mb-exact.png");
    expect(buildFilename("docx", 1, "under")).toBe("chobitfile-1mb-under.docx");
    expect(buildFilename("jpeg", 5, "over")).toBe("chobitfile-5mb-over.jpeg");
    expect(buildFilename("xlsx", 3, "exact")).toBe("chobitfile-3mb-exact.xlsx");
    expect(buildFilename("pptx", 1, "under")).toBe("chobitfile-1mb-under.pptx");
    expect(buildFilename("pdf", 10, "exact")).toBe("chobitfile-10mb-exact.pdf");
    expect(buildFilename("txt", 1, "exact")).toBe("chobitfile-1mb-exact.txt");
    expect(buildFilename("csv", 1, "exact")).toBe("chobitfile-1mb-exact.csv");
    expect(buildFilename("json", 1, "exact")).toBe("chobitfile-1mb-exact.json");
    expect(buildFilename("png", 50, "exact")).toBe("chobitfile-50mb-exact.png");
    expect(buildFilename("pdf", 100, "over")).toBe("chobitfile-100mb-over.pdf");
  });

  it("生成名だけを valid とみなす", () => {
    expect(isValidFilename("chobitfile-10mb-exact.png")).toBe(true);
    expect(isValidFilename("chobitfile-20mb-over.json")).toBe(true);
    expect(isValidFilename("chobitfile-50mb-exact.png")).toBe(true);
    expect(isValidFilename("chobitfile-100mb-over.pdf")).toBe(true);
    expect(isValidFilename("../etc/passwd")).toBe(false);
    expect(isValidFilename("chobitfile-99mb-exact.png")).toBe(false);
    expect(isValidFilename("chobitfile-1mb-exact.exe")).toBe(false);
  });

  it("大量生成 ZIP 名を組み立て・検証する", () => {
    expect(buildBulkZipFilename(100)).toBe("chobitfile-bulk-100.zip");
    expect(isValidBulkZipFilename("chobitfile-bulk-100.zip")).toBe(true);
    expect(isValidBulkZipFilename("chobitfile-bulk-10000.zip")).toBe(true);
    expect(isValidBulkZipFilename("chobitfile-bulk-0.zip")).toBe(false);
    expect(isValidBulkZipFilename("chobitfile-bulk-10001.zip")).toBe(false);
    expect(isValidBulkZipFilename("chobitfile-10mb-exact.png")).toBe(false);
  });
});
