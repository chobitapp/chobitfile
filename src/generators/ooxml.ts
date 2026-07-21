import { utf8 } from "../lib/bytes";
import { buildStoreZip, type ZipEntry } from "./zip";

/**
 * 固定エントリ + パディング用 store エントリで目標バイト数ちょうどになる
 * Office Open XML（ZIP）パッケージを組み立てる。
 */
export function generatePaddedOoxml(
  targetBytes: number,
  fixedEntries: ZipEntry[],
  paddingName: string,
  formatLabel: string,
): Uint8Array {
  if (!Number.isInteger(targetBytes) || targetBytes <= 0) {
    throw new Error(`不正な目標サイズ: ${targetBytes}`);
  }

  const nameLen = utf8(paddingName).byteLength;
  // 追加エントリ分: local(30+name) + data + central(46+name)
  const paddingEntryOverhead = 30 + nameLen + 46 + nameLen;

  const baseZip = buildStoreZip(fixedEntries);
  const paddingDataLen =
    targetBytes - baseZip.byteLength - paddingEntryOverhead;

  if (paddingDataLen < 0) {
    throw new Error(
      `目標サイズ ${targetBytes} は最小 ${formatLabel}（${baseZip.byteLength + paddingEntryOverhead}）より小さい`,
    );
  }

  const padding = new Uint8Array(paddingDataLen);
  const marker = utf8("chobitfile-padding");
  if (marker.byteLength <= paddingDataLen) {
    padding.set(marker, 0);
  }

  const out = buildStoreZip([
    ...fixedEntries,
    { name: paddingName, data: padding },
  ]);

  if (out.byteLength !== targetBytes) {
    throw new Error(
      `${formatLabel} サイズ不一致: expected ${targetBytes}, got ${out.byteLength}`,
    );
  }
  return out;
}

export function isZipLocalHeader(data: Uint8Array): boolean {
  return (
    data.byteLength >= 4 &&
    data[0] === 0x50 &&
    data[1] === 0x4b &&
    data[2] === 0x03 &&
    data[3] === 0x04
  );
}
