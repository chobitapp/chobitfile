import { utf8, writeU16LE, writeU32LE } from "../lib/bytes";
import { crc32 } from "../lib/crc32";

export type ZipEntry = {
  name: string;
  data: Uint8Array;
};

/**
 * store（無圧縮）ZIP を組み立てる。
 * DOCX など Office Open XML パッケージ向け。
 */
export function buildStoreZip(entries: ZipEntry[]): Uint8Array {
  if (entries.length === 0) {
    throw new Error("ZIP エントリが空です");
  }

  const prepared = entries.map((entry) => {
    const nameBytes = utf8(entry.name);
    if (nameBytes.byteLength > 0xffff) {
      throw new Error(`ファイル名が長すぎます: ${entry.name}`);
    }
    return {
      nameBytes,
      data: entry.data,
      crc: crc32(entry.data),
      size: entry.data.byteLength,
    };
  });

  let localTotal = 0;
  let centralTotal = 0;
  for (const item of prepared) {
    localTotal += 30 + item.nameBytes.byteLength + item.size;
    centralTotal += 46 + item.nameBytes.byteLength;
  }
  const eocdSize = 22;
  const total = localTotal + centralTotal + eocdSize;
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);

  let offset = 0;
  const localOffsets: number[] = [];

  for (const item of prepared) {
    localOffsets.push(offset);
    writeU32LE(view, offset, 0x04034b50);
    offset += 4;
    writeU16LE(view, offset, 20);
    offset += 2;
    writeU16LE(view, offset, 0);
    offset += 2;
    writeU16LE(view, offset, 0); // store
    offset += 2;
    writeU16LE(view, offset, 0);
    offset += 2;
    writeU16LE(view, offset, 0);
    offset += 2;
    writeU32LE(view, offset, item.crc);
    offset += 4;
    writeU32LE(view, offset, item.size);
    offset += 4;
    writeU32LE(view, offset, item.size);
    offset += 4;
    writeU16LE(view, offset, item.nameBytes.byteLength);
    offset += 2;
    writeU16LE(view, offset, 0);
    offset += 2;
    out.set(item.nameBytes, offset);
    offset += item.nameBytes.byteLength;
    out.set(item.data, offset);
    offset += item.size;
  }

  const centralOffset = offset;

  for (let i = 0; i < prepared.length; i++) {
    const item = prepared[i];
    writeU32LE(view, offset, 0x02014b50);
    offset += 4;
    writeU16LE(view, offset, 20);
    offset += 2;
    writeU16LE(view, offset, 20);
    offset += 2;
    writeU16LE(view, offset, 0);
    offset += 2;
    writeU16LE(view, offset, 0);
    offset += 2;
    writeU16LE(view, offset, 0);
    offset += 2;
    writeU16LE(view, offset, 0);
    offset += 2;
    writeU32LE(view, offset, item.crc);
    offset += 4;
    writeU32LE(view, offset, item.size);
    offset += 4;
    writeU32LE(view, offset, item.size);
    offset += 4;
    writeU16LE(view, offset, item.nameBytes.byteLength);
    offset += 2;
    writeU16LE(view, offset, 0);
    offset += 2;
    writeU16LE(view, offset, 0);
    offset += 2;
    writeU16LE(view, offset, 0);
    offset += 2;
    writeU16LE(view, offset, 0);
    offset += 2;
    writeU32LE(view, offset, 0);
    offset += 4;
    writeU32LE(view, offset, localOffsets[i]);
    offset += 4;
    out.set(item.nameBytes, offset);
    offset += item.nameBytes.byteLength;
  }

  const centralSize = offset - centralOffset;
  writeU32LE(view, offset, 0x06054b50);
  offset += 4;
  writeU16LE(view, offset, 0);
  offset += 2;
  writeU16LE(view, offset, 0);
  offset += 2;
  writeU16LE(view, offset, prepared.length);
  offset += 2;
  writeU16LE(view, offset, prepared.length);
  offset += 2;
  writeU32LE(view, offset, centralSize);
  offset += 4;
  writeU32LE(view, offset, centralOffset);
  offset += 4;
  writeU16LE(view, offset, 0);
  offset += 2;

  if (offset !== total) {
    throw new Error(`ZIP サイズ不整合: expected ${total}, got ${offset}`);
  }
  return out;
}
