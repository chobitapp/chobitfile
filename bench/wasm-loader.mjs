/**
 * MoonBit wasm-gc モジュールのロード。
 * JS String Builtins を有効化する。
 */

/**
 * @param {string | URL} wasmUrl
 */
export async function loadMoonBitWasm(wasmUrl) {
  const response = await fetch(wasmUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch wasm: ${response.status} ${wasmUrl}`);
  }
  const bytes = await response.arrayBuffer();
  return instantiateMoonBitWasm(bytes);
}

/**
 * Node 向け: ファイルパスから読み込み。
 * @param {string} path
 */
export async function loadMoonBitWasmFromFile(path) {
  const { readFile } = await import("node:fs/promises");
  const bytes = await readFile(path);
  return instantiateMoonBitWasm(bytes);
}

/**
 * @param {BufferSource} bytes
 */
async function instantiateMoonBitWasm(bytes) {
  const { instance } = await WebAssembly.instantiate(bytes, {}, {
    builtins: ["js-string"],
    importedStringConstants: "_",
  });
  const e = instance.exports;
  for (const name of [
    "pad_zeros",
    "pad_pattern",
    "crc32_pattern",
    "zip_store",
    "text_pad",
  ]) {
    if (typeof e[name] !== "function") {
      throw new Error(`WASM export missing: ${name}`);
    }
  }
  return {
    pad_zeros: (size) => e.pad_zeros(size),
    pad_pattern: (size) => e.pad_pattern(size, 0x5a),
    crc32_pattern: (size) => e.crc32_pattern(size, 0x5a),
    zip_store: (size) => e.zip_store(size),
    text_pad: (size) => e.text_pad(size),
  };
}
