# chobitfile

指定サイズ・形式のダミーファイルをブラウザ側で生成するツール（開発中）。

このリポジトリではまず **JS と MoonBit (WASM) の性能比較** を行い、技術選定の根拠を取る。

## 結論（2026-07-21 計測）

**chobitfile のブラウザ生成は、まず素の JS（必要なら Web Worker）で進める。**

MoonBit wasm-gc は、今回のワークロードでは JS を一貫して上回らなかった。  
WASM を後から部分導入する余地は残すが、MVP の前提技術にはしない。

| 処理 | 傾向 | 所見 |
|---|---|---|
| 単純ゼロ埋め | **JS が 25–33 倍速い** | `new Uint8Array(n)` のゼロ初期化がエンジン最適化済み |
| パターン埋め | ほぼ互角（〜1.2x 前後） | ループ書き込み。サイズによって勝者入れ替わり |
| CRC32（埋め+計算） | **JS が約 1.5 倍速い** | テーブル CRC でも V8 の TypedArray ループが強い |
| ZIP store 構築 | **JS が約 1.7–1.9 倍速い** | CRC + バッファ組み立て。WASM 側の追加コストが効く |
| PDF 風テキスト | **JS が約 7–10 倍速い** | 文字列連結は JS エンジンが得意 |

詳細な数値は下記「計測結果」を参照。

### なぜ「WASM が速い」定説とずれるか

- 比較対象が **Rust 手作り線形メモリ** ではなく **MoonBit wasm-gc**（GC 配列・境界チェックあり）である
- ダミー生成のホットパスは「巨大バッファの確保・単純ループ」で、**V8 の TypedArray がすでに十分速い**
- 本ベンチは **JS↔WASM のメモリコピーを含まない**（各実装内で完結）。実プロダクトで WASM 生成結果を `Blob` にする場合、コピーコストがさらに乗る
- ウォームアップ後の JS は JIT が効き、初回実行だけの比較では WASM 有利に見えやすい

### プロダクト方針への落とし込み

1. **本体は JS**（`Uint8Array` / `Blob` / 必要なら `File System Access API`）
2. **重い形式は Web Worker** で UI ブロックを避ける（WASM の有無とは独立）
3. MoonBit/WASM は、将来「明らかに計算律速で JS が足りない」処理が出たときだけ再検討
4. 形式の難易度表（CSV → PDF → PNG → ZIP → MP4）に沿って縦スライス実装

## ベンチの回し方

前提: `moon`（MoonBit）、Node.js、pnpm。

```bash
# WASM ビルド + 1/10/100MB フル計測（推奨）
pnpm bench

# 短い確認（1MB, 10MB）
pnpm bench:quick

# ブラウザ UI（http://localhost:8765）
pnpm bench:serve
```

オプション例:

```bash
node --expose-gc bench/run.mjs --sizes 1,10 --iters 5 --warmup 2
```

- 計測は `performance.now()`、ウォームアップ後の **中央値 (ms)**
- JS / MoonBit で同一アルゴリズム・同一返り値になることを毎回検証（`結果一致` 列）
- 詳細 JSON は `bench/last-results.json` に出力

## 計測結果（Node v26.3.0 / darwin / `--expose-gc`）

| 処理 | サイズ | JS (ms) | WASM (ms) | WASM/JS | 勝者 |
|---|---:|---:|---:|---:|---|
| 単純ゼロ埋め | 1MB | 0.014 | 0.345 | 24.6x | js |
| パターン埋め | 1MB | 0.995 | 0.670 | 0.67x | wasm |
| CRC32（埋め+計算） | 1MB | 2.683 | 3.962 | 1.48x | js |
| ZIP store 構築 | 1MB | 2.738 | 4.694 | 1.71x | js |
| PDF風テキスト組み立て | 1MB | 0.195 | 1.820 | 9.33x | js |
| 単純ゼロ埋め | 10MB | 0.124 | 3.283 | 26.5x | js |
| パターン埋め | 10MB | 7.901 | 6.436 | 0.81x | wasm |
| CRC32（埋め+計算） | 10MB | 26.843 | 39.904 | 1.49x | js |
| ZIP store 構築 | 10MB | 27.156 | 48.492 | 1.79x | js |
| PDF風テキスト組み立て | 10MB | 1.901 | 19.131 | 10.1x | js |
| 単純ゼロ埋め | 100MB | 1.215 | 40.154 | 33.0x | js |
| パターン埋め | 100MB | 64.440 | 72.848 | 1.13x | js |
| CRC32（埋め+計算） | 100MB | 266.259 | 411.109 | 1.54x | js |
| ZIP store 構築 | 100MB | 270.201 | 500.119 | 1.85x | js |
| PDF風テキスト組み立て | 100MB | 27.884 | 202.945 | 7.28x | js |

※ WASM/JS < 1 なら WASM が速い。勝者は 10% 以上の差があるときのみ。

## リポジトリ構成

```
bench/                 # ベンチランナー（JS 実装・UI・Node CLI）
moonbit-bench/         # MoonBit wasm-gc ライブラリ
scripts/copy-wasm.mjs  # ビルド成果物を bench/ へコピー
```

### 計測カテゴリ

| キー | 内容 | 想定ドメイン |
|---|---|---|
| `pad_zeros` | N バイトのゼロ埋め | 生バイナリ・単純パディング |
| `pad_pattern` | インデックス依存パターン書き込み | ランダム風パディング |
| `crc32_pattern` | 埋め + IEEE CRC-32 | PNG 等 |
| `zip_store` | store 方式 ZIP 組み立て | DOCX/XLSX/PPTX |
| `text_pad` | PDF 風コメントパディング | PDF / テキスト系 |

## MoonBit 側のメモ

- ターゲット: `wasm-gc` + JS String Builtins
- 成果物サイズ: 約 6.4 KB（release）
- バイト列を JS の `Uint8Array` として安価に受け渡す経路は、本検証では未使用（計算完結型 API）
- 実サービスで WASM 生成結果をダウンロードする場合は、線形メモリ backend やコピー戦略の追加検証が必要
