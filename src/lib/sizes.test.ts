import { describe, expect, it } from "vitest";
import { baseBytesForMb, MAX_TARGET_BYTES, targetBytesFor } from "./sizes";

describe("sizes", () => {
  it("1MB は 1048576 バイト", () => {
    expect(baseBytesForMb(1)).toBe(1_048_576);
  });

  it("100MB は 104857600 バイト", () => {
    expect(baseBytesForMb(100)).toBe(104_857_600);
  });

  it("MAX_TARGET_BYTES は 100MB + 1", () => {
    expect(MAX_TARGET_BYTES).toBe(100 * 1024 * 1024 + 1);
    expect(targetBytesFor(100, "over")).toBe(MAX_TARGET_BYTES);
  });

  it("境界モードが ±1 を適用する", () => {
    expect(targetBytesFor(1, "exact")).toBe(1_048_576);
    expect(targetBytesFor(1, "under")).toBe(1_048_575);
    expect(targetBytesFor(1, "over")).toBe(1_048_577);
  });
});
