/**
 * MoonBit 側と同じアルゴリズムの JS 実装。
 * 比較が公平になるよう、API 形状・計算内容を揃えている。
 */

/** @type {Uint32Array} */
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

/**
 * @param {Uint8Array} data
 * @returns {number} CRC-32 as signed 32-bit (MoonBit Int と合わせる)
 */
export function crc32Bytes(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return ((crc ^ 0xffffffff) | 0);
}

/**
 * @param {number} size
 * @returns {number}
 */
export function padZeros(size) {
  const data = new Uint8Array(size); // ゼロ初期化
  const last = size > 0 ? data[size - 1] : 0;
  return size ^ last;
}

/**
 * @param {number} size
 * @param {number} pattern
 * @returns {number}
 */
export function padPattern(size, pattern) {
  const base = pattern & 0xff;
  const data = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    data[i] = (i * 131 + base) & 0xff;
  }
  let sum = 0;
  const step = size > 4096 ? Math.floor(size / 4096) : 1;
  for (let i = 0; i < size; i += step) {
    sum += data[i];
  }
  if (size > 0) sum += data[size - 1];
  return sum;
}

/**
 * @param {number} size
 * @param {number} pattern
 * @returns {number}
 */
export function crc32Pattern(size, pattern) {
  const p = pattern & 0xff;
  const data = new Uint8Array(size);
  data.fill(p);
  return crc32Bytes(data);
}

/**
 * @param {number} payloadSize
 * @returns {number}
 */
export function zipStore(payloadSize) {
  const payload = new Uint8Array(payloadSize); // zeros
  const crc = crc32Bytes(payload) >>> 0;
  const name = new TextEncoder().encode("dummy.bin");
  const nameLen = name.length;

  const localHeaderSize = 30 + nameLen;
  const centralSize = 46 + nameLen;
  const eocdSize = 22;
  const total = localHeaderSize + payloadSize + centralSize + eocdSize;

  const buf = new Uint8Array(total);
  const view = new DataView(buf.buffer);
  let o = 0;

  // Local file header
  view.setUint32(o, 0x04034b50, true);
  o += 4;
  view.setUint16(o, 20, true);
  o += 2;
  view.setUint16(o, 0, true);
  o += 2;
  view.setUint16(o, 0, true);
  o += 2; // store
  view.setUint16(o, 0, true);
  o += 2;
  view.setUint16(o, 0, true);
  o += 2;
  view.setUint32(o, crc, true);
  o += 4;
  view.setUint32(o, payloadSize, true);
  o += 4;
  view.setUint32(o, payloadSize, true);
  o += 4;
  view.setUint16(o, nameLen, true);
  o += 2;
  view.setUint16(o, 0, true);
  o += 2;
  buf.set(name, o);
  o += nameLen;
  buf.set(payload, o);
  o += payloadSize;

  const centralOffset = localHeaderSize + payloadSize;

  // Central directory
  view.setUint32(o, 0x02014b50, true);
  o += 4;
  view.setUint16(o, 20, true);
  o += 2;
  view.setUint16(o, 20, true);
  o += 2;
  view.setUint16(o, 0, true);
  o += 2;
  view.setUint16(o, 0, true);
  o += 2;
  view.setUint16(o, 0, true);
  o += 2;
  view.setUint16(o, 0, true);
  o += 2;
  view.setUint32(o, crc, true);
  o += 4;
  view.setUint32(o, payloadSize, true);
  o += 4;
  view.setUint32(o, payloadSize, true);
  o += 4;
  view.setUint16(o, nameLen, true);
  o += 2;
  view.setUint16(o, 0, true);
  o += 2;
  view.setUint16(o, 0, true);
  o += 2;
  view.setUint16(o, 0, true);
  o += 2;
  view.setUint16(o, 0, true);
  o += 2;
  view.setUint32(o, 0, true);
  o += 4;
  view.setUint32(o, 0, true);
  o += 4;
  buf.set(name, o);
  o += nameLen;

  // EOCD
  view.setUint32(o, 0x06054b50, true);
  o += 4;
  view.setUint16(o, 0, true);
  o += 2;
  view.setUint16(o, 0, true);
  o += 2;
  view.setUint16(o, 1, true);
  o += 2;
  view.setUint16(o, 1, true);
  o += 2;
  view.setUint32(o, centralSize, true);
  o += 4;
  view.setUint32(o, centralOffset, true);
  o += 4;
  view.setUint16(o, 0, true);
  o += 2;

  return (buf.length ^ crc) | 0;
}

/**
 * @param {number} targetSize
 * @returns {number}
 */
export function textPad(targetSize) {
  const header =
    "%PDF-1.4\n%// binary marker\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const footer =
    "\ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n0\n%%EOF\n";
  const overhead = header.length + footer.length + 2;
  const n = Math.max(0, targetSize - overhead);
  const chunk =
    "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

  // 配列 join は V8 で高速。StringBuilder 相当。
  const parts = [header, "%"];
  let remaining = n;
  while (remaining >= chunk.length) {
    parts.push(chunk);
    remaining -= chunk.length;
  }
  if (remaining > 0) parts.push(chunk.slice(0, remaining));
  parts.push("\n", footer);
  return parts.join("").length;
}

export const jsImpl = {
  pad_zeros: padZeros,
  pad_pattern: (size) => padPattern(size, 0x5a),
  crc32_pattern: (size) => crc32Pattern(size, 0x5a),
  zip_store: zipStore,
  text_pad: textPad,
};
