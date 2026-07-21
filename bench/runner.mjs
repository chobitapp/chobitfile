/**
 * JS vs MoonBit WASM ベンチマーク共通ロジック。
 */

/**
 * @typedef {{ name: string, run: (size: number) => number | void }} BenchFn
 */

/**
 * @param {() => number | void} fn
 * @param {number} warmup
 * @param {number} iterations
 * @returns {{ times: number[], median: number, mean: number, min: number, result: number | void }}
 */
export function measure(fn, warmup = 2, iterations = 5) {
  for (let i = 0; i < warmup; i++) fn();

  /** @type {number[]} */
  const times = [];
  let result;
  for (let i = 0; i < iterations; i++) {
    // GC の影響を少し均す
    if (typeof globalThis.gc === "function") globalThis.gc();
    const t0 = performance.now();
    result = fn();
    const t1 = performance.now();
    times.push(t1 - t0);
  }
  const sorted = [...times].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const min = sorted[0];
  return { times, median, mean, min, result };
}

/**
 * @param {Record<string, (size: number) => number>} impl
 * @param {string} label
 * @param {number[]} sizes
 * @param {{ warmup?: number, iterations?: number, onProgress?: (msg: string) => void }} opts
 */
export async function runSuite(impl, label, sizes, opts = {}) {
  const warmup = opts.warmup ?? 2;
  const iterations = opts.iterations ?? 5;
  const onProgress = opts.onProgress ?? (() => {});

  const benches = [
    { key: "pad_zeros", title: "単純ゼロ埋め", fn: impl.pad_zeros },
    { key: "pad_pattern", title: "パターン埋め", fn: impl.pad_pattern },
    { key: "crc32_pattern", title: "CRC32（埋め+計算）", fn: impl.crc32_pattern },
    { key: "zip_store", title: "ZIP store 構築", fn: impl.zip_store },
    { key: "text_pad", title: "PDF風テキスト組み立て", fn: impl.text_pad },
  ];

  /** @type {Array<Record<string, unknown>>} */
  const rows = [];

  for (const size of sizes) {
    for (const b of benches) {
      // 100MB で text 以外はメモリが厳しい場合があるので呼び出し側で制御
      onProgress(`${label} / ${b.title} / ${formatSize(size)}`);
      const stats = measure(() => b.fn(size), warmup, iterations);
      rows.push({
        impl: label,
        bench: b.key,
        title: b.title,
        size,
        sizeLabel: formatSize(size),
        medianMs: round(stats.median, 3),
        meanMs: round(stats.mean, 3),
        minMs: round(stats.min, 3),
        times: stats.times.map((t) => round(t, 3)),
        result: stats.result,
      });
    }
  }
  return rows;
}

/**
 * @param {Array<Record<string, unknown>>} jsRows
 * @param {Array<Record<string, unknown>>} wasmRows
 */
export function compare(jsRows, wasmRows) {
  /** @type {Array<Record<string, unknown>>} */
  const out = [];
  for (const js of jsRows) {
    const wasm = wasmRows.find(
      (w) => w.bench === js.bench && w.size === js.size,
    );
    if (!wasm) continue;
    const jsMs = /** @type {number} */ (js.medianMs);
    const wasmMs = /** @type {number} */ (wasm.medianMs);
    const ratio = jsMs > 0 ? wasmMs / jsMs : NaN;
    let winner = "tie";
    if (wasmMs < jsMs * 0.9) winner = "wasm";
    else if (jsMs < wasmMs * 0.9) winner = "js";
    out.push({
      bench: js.bench,
      title: js.title,
      size: js.size,
      sizeLabel: js.sizeLabel,
      jsMedianMs: jsMs,
      wasmMedianMs: wasmMs,
      wasmOverJs: round(ratio, 3),
      speedupWasm: ratio > 0 ? round(1 / ratio, 3) : NaN,
      winner,
      resultMatch: js.result === wasm.result,
    });
  }
  return out;
}

/** @param {number} n @param {number} d */
function round(n, d) {
  const p = 10 ** d;
  return Math.round(n * p) / p;
}

/** @param {number} size */
export function formatSize(size) {
  if (size >= 1024 * 1024) return `${size / (1024 * 1024)}MB`;
  if (size >= 1024) return `${size / 1024}KB`;
  return `${size}B`;
}

/**
 * 結果を Markdown 表にする
 * @param {Array<Record<string, unknown>>} comparisons
 */
export function toMarkdownTable(comparisons) {
  const lines = [
    "| 処理 | サイズ | JS (ms) | WASM (ms) | WASM/JS | 勝者 | 結果一致 |",
    "|---|---:|---:|---:|---:|---|---|",
  ];
  for (const r of comparisons) {
    lines.push(
      `| ${r.title} | ${r.sizeLabel} | ${r.jsMedianMs} | ${r.wasmMedianMs} | ${r.wasmOverJs}x | ${r.winner} | ${r.resultMatch ? "yes" : "NO"} |`,
    );
  }
  return lines.join("\n");
}
