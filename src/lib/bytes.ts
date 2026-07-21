export function concatBytes(parts: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const part of parts) total += part.byteLength;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.byteLength;
  }
  return out;
}

export function writeU16LE(
  view: DataView,
  offset: number,
  value: number,
): void {
  view.setUint16(offset, value, true);
}

export function writeU32LE(
  view: DataView,
  offset: number,
  value: number,
): void {
  view.setUint32(offset, value, true);
}

export function writeU32BE(
  view: DataView,
  offset: number,
  value: number,
): void {
  view.setUint32(offset, value, false);
}

export function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}
