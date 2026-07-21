import { describe, expect, it } from "vitest";
import { buildFilename } from "./filename";

describe("filename", () => {
  it("仕様どおりの名前を返す", () => {
    expect(buildFilename("png", 10, "exact")).toBe("chobitfile-10mb-exact.png");
    expect(buildFilename("docx", 1, "under")).toBe("chobitfile-1mb-under.docx");
  });
});
