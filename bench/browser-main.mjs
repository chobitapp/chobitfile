import { jsImpl } from "./js-impl.mjs";
import { loadMoonBitWasm } from "./wasm-loader.mjs";
import { runSuite, compare, toMarkdownTable } from "./runner.mjs";

const statusEl = document.getElementById("status");
const tableWrap = document.getElementById("table-wrap");
const mdEl = document.getElementById("md");
const runBtn = document.getElementById("run");

let wasmImpl = null;

function setStatus(msg) {
  statusEl.textContent = msg;
}

async function init() {
  try {
    wasmImpl = await loadMoonBitWasm(new URL("./moonbit_bench.wasm", import.meta.url));
    setStatus("WASM 読み込み完了。実行ボタンを押してください。");
    runBtn.disabled = false;
  } catch (e) {
    console.error(e);
    setStatus(`WASM 読み込み失敗: ${e.message}`);
    runBtn.disabled = true;
  }
}

function selectedSizes() {
  return [...document.querySelectorAll('input[name="size"]:checked')].map((el) =>
    Number(el.value),
  );
}

function renderTable(comparisons) {
  if (comparisons.length === 0) {
    tableWrap.innerHTML = "<p class='sub'>結果なし</p>";
    return;
  }
  const rows = comparisons
    .map((r) => {
      const cls = `winner-${r.winner}`;
      return `<tr>
        <td>${r.title}</td>
        <td class="num">${r.sizeLabel}</td>
        <td class="num">${r.jsMedianMs}</td>
        <td class="num">${r.wasmMedianMs}</td>
        <td class="num">${r.wasmOverJs}x</td>
        <td class="${cls}">${r.winner}</td>
        <td>${r.resultMatch ? "yes" : "NO"}</td>
      </tr>`;
    })
    .join("");
  tableWrap.innerHTML = `<table>
    <thead>
      <tr>
        <th>処理</th><th>サイズ</th><th>JS (ms)</th><th>WASM (ms)</th>
        <th>WASM/JS</th><th>勝者</th><th>一致</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

runBtn.disabled = true;
runBtn.addEventListener("click", async () => {
  if (!wasmImpl) return;
  const sizes = selectedSizes();
  if (sizes.length === 0) {
    setStatus("サイズを1つ以上選んでください。");
    return;
  }
  const warmup = Number(document.getElementById("warmup").value) || 0;
  const iterations = Number(document.getElementById("iters").value) || 1;

  runBtn.disabled = true;
  try {
    const onProgress = (msg) => setStatus(msg);
    setStatus("JS 実行中…");
    // UI 更新を挟む
    await new Promise((r) => setTimeout(r, 30));
    const jsRows = await runSuite(jsImpl, "js", sizes, {
      warmup,
      iterations,
      onProgress,
    });
    setStatus("WASM 実行中…");
    await new Promise((r) => setTimeout(r, 30));
    const wasmRows = await runSuite(wasmImpl, "wasm", sizes, {
      warmup,
      iterations,
      onProgress,
    });
    const comparisons = compare(jsRows, wasmRows);
    renderTable(comparisons);
    mdEl.textContent = toMarkdownTable(comparisons);
    setStatus("完了");
  } catch (e) {
    console.error(e);
    setStatus(`エラー: ${e.message}`);
  } finally {
    runBtn.disabled = false;
  }
});

init();
