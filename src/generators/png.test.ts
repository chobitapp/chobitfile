import { describe, expect, it } from "vitest";
import { crc32 } from "../lib/crc32";
import { targetBytesFor } from "../lib/sizes";
import { generatePng, isPngSignature } from "./png";

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
});
