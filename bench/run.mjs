#!/usr/bin/env node
/**
 * Node.js 上で JS vs MoonBit WASM ベンチを実行する。
 *
 * 使い方:
 *   node bench/run.mjs
 *   node --expose-gc bench/run.mjs
 *   node bench/run.mjs --sizes 1,10 --iters 3
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { jsImpl } from "./js-impl.mjs";
import { loadMoonBitWasmFromFile } from "./wasm-loader.mjs";
import {
  runSuite,
  compare,
  toMarkdownTable,
  formatSize,
} from "./runner.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const defaultWasm = path.join(
  root,
  "moonbit-bench/_build/wasm-gc/release/build/moonbit_bench.wasm",
);

function parseArgs(argv) {
  /** @type {{ sizes: number[], iters: number, warmup: number, wasm: string }} */
  const opts = {
    sizes: [1 * 1024 * 1024, 10 * 1024 * 1024, 100 * 1024 * 1024],
    iters: 5,
    warmup: 2,
    wasm: defaultWasm,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--sizes" && argv[i + 1]) {
      // MB 単位のカンマ区切り: 1,10,100
      opts.sizes = argv[++i]
        .split(",")
        .map((s) => Number(s.trim()) * 1024 * 1024)
        .filter((n) => n > 0);
    } else if (a === "--iters" && argv[i + 1]) {
      opts.iters = Number(argv[++i]);
    } else if (a === "--warmup" && argv[i + 1]) {
      opts.warmup = Number(argv[++i]);
    } else if (a === "--wasm" && argv[i + 1]) {
      opts.wasm = argv[++i];
    } else if (a === "--help" || a === "-h") {
      console.log(`Usage: node bench/run.mjs [--sizes 1,10,100] [--iters 5] [--warmup 2] [--wasm path]`);
      process.exit(0);
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  console.log("=== chobitfile: JS vs MoonBit WASM ベンチマーク ===");
  console.log(`WASM: ${opts.wasm}`);
  console.log(
    `sizes: ${opts.sizes.map(formatSize).join(", ")}, warmup=${opts.warmup}, iters=${opts.iters}`,
  );
  console.log(
    `gc: ${typeof globalThis.gc === "function" ? "exposed (--expose-gc)" : "not exposed"}`,
  );
  console.log("");

  const wasmImpl = await loadMoonBitWasmFromFile(opts.wasm);
  console.log("WASM loaded. exports OK.\n");

  // 正しさのスポットチェック（小さなサイズ）
  const checkSize = 4096;
  for (const key of Object.keys(jsImpl)) {
    const j = jsImpl[key](checkSize);
    const w = wasmImpl[key](checkSize);
    if (j !== w) {
      console.warn(`WARN: result mismatch on ${key}(${checkSize}): js=${j} wasm=${w}`);
    }
  }

  const progress = (msg) => {
    process.stdout.write(`  running: ${msg.padEnd(48)}\r`);
  };

  console.log("--- JS ---");
  const jsRows = await runSuite(jsImpl, "js", opts.sizes, {
    warmup: opts.warmup,
    iterations: opts.iters,
    onProgress: progress,
  });
  process.stdout.write("\n");

  console.log("--- MoonBit WASM ---");
  const wasmRows = await runSuite(wasmImpl, "wasm", opts.sizes, {
    warmup: opts.warmup,
    iterations: opts.iters,
    onProgress: progress,
  });
  process.stdout.write("\n\n");

  const comparisons = compare(jsRows, wasmRows);
  console.log(toMarkdownTable(comparisons));
  console.log("");

  // カテゴリ別サマリ
  const byBench = new Map();
  for (const c of comparisons) {
    if (!byBench.has(c.bench)) byBench.set(c.bench, []);
    byBench.get(c.bench).push(c);
  }
  console.log("## カテゴリ別（WASM が JS より速い倍率 = speedupWasm の中央値）");
  for (const [bench, rows] of byBench) {
    const speeds = rows.map((r) => r.speedupWasm).filter((x) => Number.isFinite(x));
    speeds.sort((a, b) => a - b);
    const med = speeds[Math.floor(speeds.length / 2)];
    const title = rows[0].title;
    const wins = rows.filter((r) => r.winner === "wasm").length;
    const jwins = rows.filter((r) => r.winner === "js").length;
    console.log(
      `- ${title} (${bench}): speedupWasm≈${med}x  (wasm勝 ${wins} / js勝 ${jwins} / 計 ${rows.length})`,
    );
  }

  // JSON も吐く（後で README に貼れる）
  const outPath = path.join(__dirname, "last-results.json");
  const { writeFile } = await import("node:fs/promises");
  await writeFile(
    outPath,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        opts,
        comparisons,
        jsRows,
        wasmRows,
      },
      null,
      2,
    ),
  );
  console.log(`\n詳細 JSON: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
