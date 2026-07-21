import { describe, expect, it } from "vitest";
import { crc32 } from "../lib/crc32";
import { targetBytesFor } from "../lib/sizes";
import {
  buildMinimalPng,
  findIendOffset,
  generateLabeledPng,
  generatePng,
  isPngSignature,
} from "./png";

function readChunkAt(data: Uint8Array, offset: number) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const length = view.getUint32(offset, false);
  const type = String.fromCharCode(
    data[offset + 4],
    data[offset + 5],
    data[offset + 6],
    data[offset + 7],
  );
  const chunkData = data.subarray(offset + 8, offset + 8 + length);
  const crc = view.getUint32(offset + 8 + length, false);
  return { length, type, chunkData, crc, next: offset + 12 + length };
}

function listChunkTypes(png: Uint8Array): string[] {
  const types: string[] = [];
  let offset = 8;
  while (offset < png.byteLength) {
    const chunk = readChunkAt(png, offset);
    types.push(chunk.type);
    offset = chunk.next;
  }
  return types;
}

describe("generatePng", () => {
  it.each([
    [1, "exact"] as const,
    [1, "under"] as const,
    [1, "over"] as const,
    [3, "exact"] as const,
  ])("%sMB %s で目標バイト数ちょうど", (sizeMb, boundary) => {
    const target = targetBytesFor(sizeMb, boundary);
    const png = generatePng(target);
    expect(png.byteLength).toBe(target);
    expect(isPngSignature(png)).toBe(true);

    // IEND で終わる
    const iend = png.subarray(png.byteLength - 12);
    expect(String.fromCharCode(...iend.subarray(4, 8))).toBe("IEND");
  });

  it("チャンク CRC が正しい", () => {
    const png = generatePng(targetBytesFor(1, "exact"));
    let offset = 8; // skip signature
    while (offset < png.byteLength) {
      const chunk = readChunkAt(png, offset);
      const typeBytes = png.subarray(offset + 4, offset + 8);
      const crcInput = new Uint8Array(4 + chunk.chunkData.byteLength);
      crcInput.set(typeBytes, 0);
      crcInput.set(chunk.chunkData, 4);
      expect(chunk.crc).toBe(crc32(crcInput));
      offset = chunk.next;
    }
  });

  it("任意のベース PNG を IEND 直前でパディングできる", () => {
    const base = buildMinimalPng();
    const target = 2048;
    const png = generatePng(target, base);
    expect(png.byteLength).toBe(target);
    expect(listChunkTypes(png)).toEqual(["IHDR", "IDAT", "chBk", "IEND"]);
    expect(findIendOffset(png)).toBe(target - 12);
  });

  it("ベース PNG が目標より大きいとエラー", () => {
    const base = buildMinimalPng();
    expect(() => generatePng(base.byteLength, base)).toThrow(/より小さい/);
  });
});

describe("generateLabeledPng", () => {
  it("Node ではフォールバックしつつ目標サイズを満たす", async () => {
    // OffscreenCanvas なし → 最小 PNG ベースでもサイズは合う
    const target = targetBytesFor(1, "exact");
    const png = await generateLabeledPng(target, {
      sizeMb: 1,
      boundary: "exact",
      targetBytes: target,
    });
    expect(png.byteLength).toBe(target);
    expect(isPngSignature(png)).toBe(true);
    expect(listChunkTypes(png).at(-1)).toBe("IEND");
    expect(listChunkTypes(png)).toContain("chBk");
  });
});
