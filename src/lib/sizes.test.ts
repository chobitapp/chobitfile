import { describe, expect, it } from "vitest";
import { baseBytesForMb, targetBytesFor } from "./sizes";

describe("sizes", () => {
  it("1MB は 1048576 バイト", () => {
    expect(baseBytesForMb(1)).toBe(1_048_576);
  });

  it("境界モードが ±1 を適用する", () => {
    expect(targetBytesFor(1, "exact")).toBe(1_048_576);
    expect(targetBytesFor(1, "under")).toBe(1_048_575);
    expect(targetBytesFor(1, "over")).toBe(1_048_577);
  });
});
