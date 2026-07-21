import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(
  root,
  "moonbit-bench/_build/wasm-gc/release/build/moonbit_bench.wasm",
);
const destDir = path.join(root, "bench");
const dest = path.join(destDir, "moonbit_bench.wasm");

await mkdir(destDir, { recursive: true });
await copyFile(src, dest);
console.log(`copied ${src} -> ${dest}`);
