import { describe, expect, it } from "vitest";
import { formatBytes, sizeOptionLabel } from "./format";

describe("i18n format", () => {
  it("formats bytes with locale separators", () => {
    expect(formatBytes(1_048_576, "ja")).toBe("1,048,576");
    expect(formatBytes(1_048_576, "en")).toBe("1,048,576");
  });

  it("builds size option labels per locale", () => {
    expect(sizeOptionLabel(1, "ja")).toBe("1 MB（1,048,576 バイト）");
    expect(sizeOptionLabel(1, "en")).toBe("1 MB (1,048,576 bytes)");
  });
});
