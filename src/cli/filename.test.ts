import { describe, expect, it } from "vitest";
import { buildCliFilename } from "./filename";

describe("buildCliFilename", () => {
  it("Web プリセットは Web と同じ名前", () => {
    expect(
      buildCliFilename({
        type: "png",
        targetBytes: 10_485_760,
        boundary: "exact",
        sizeMbLabel: 10,
        fromBytesFlag: false,
      }),
    ).toBe("chobitfile-10mb-exact.png");
  });

  it("プリセット外の整数 MiB は mb ラベル付き", () => {
    expect(
      buildCliFilename({
        type: "pdf",
        targetBytes: 2_097_152,
        boundary: "exact",
        sizeMbLabel: 2,
        fromBytesFlag: false,
      }),
    ).toBe("chobitfile-2mb-exact.pdf");
  });

  it("--bytes や kb 指定はバイト数入りの名前", () => {
    expect(
      buildCliFilename({
        type: "json",
        targetBytes: 1_234_567,
        boundary: "exact",
        sizeMbLabel: null,
        fromBytesFlag: true,
      }),
    ).toBe("chobitfile-1234567b.json");
  });
});
