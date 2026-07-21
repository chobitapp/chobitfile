import { describe, expect, it } from "vitest";
import { targetBytesFor } from "../lib/sizes";
import {
  buildMinimalJpeg,
  findEoiOffset,
  generateJpeg,
  generateLabeledJpeg,
  hasJpegEoi,
  isJpegSignature,
} from "./jpeg";

describe("generateJpeg", () => {
  it.each([
    [1, "exact"] as const,
    [1, "under"] as const,
    [1, "over"] as const,
    [3, "exact"] as const,
  ])("%sMB %s で目標バイト数ちょうど", (sizeMb, boundary) => {
    const target = targetBytesFor(sizeMb, boundary);
    const jpeg = generateJpeg(target);
    expect(jpeg.byteLength).toBe(target);
    expect(isJpegSignature(jpeg)).toBe(true);
    expect(hasJpegEoi(jpeg)).toBe(true);
    expect(findEoiOffset(jpeg)).toBe(target - 2);
  });

  it("任意のベース JPEG を EOI 直前でパディングできる", () => {
    const base = buildMinimalJpeg();
    const target = base.byteLength + 100;
    const jpeg = generateJpeg(target, base);
    expect(jpeg.byteLength).toBe(target);
    expect(isJpegSignature(jpeg)).toBe(true);
    expect(hasJpegEoi(jpeg)).toBe(true);
  });

  it("ベース JPEG が目標より大きいとエラー", () => {
    const base = buildMinimalJpeg();
    expect(() => generateJpeg(base.byteLength - 1, base)).toThrow(/より小さい/);
  });

  it("最小 JPEG 自体が有効なシグネチャと EOI を持つ", () => {
    const base = buildMinimalJpeg();
    expect(isJpegSignature(base)).toBe(true);
    expect(hasJpegEoi(base)).toBe(true);
    expect(findEoiOffset(base)).toBe(base.byteLength - 2);
  });
});

describe("generateLabeledJpeg", () => {
  it("Node ではフォールバックしつつ目標サイズを満たす", async () => {
    // OffscreenCanvas なし → 最小 JPEG ベースでもサイズは合う
    const target = targetBytesFor(1, "exact");
    const jpeg = await generateLabeledJpeg(target, {
      sizeMb: 1,
      boundary: "exact",
      targetBytes: target,
    });
    expect(jpeg.byteLength).toBe(target);
    expect(isJpegSignature(jpeg)).toBe(true);
    expect(hasJpegEoi(jpeg)).toBe(true);
    expect(findEoiOffset(jpeg)).toBe(target - 2);
  });
});
