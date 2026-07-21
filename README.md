# chobitfile

指定サイズ・形式のダミーファイルをブラウザ側で生成するツール（開発中）。

## 技術選定（要約）

**ブラウザ生成の本体は素の JS（必要なら Web Worker）。MoonBit/WASM は MVP の前提にしない。**

| 観点 | 結果 |
|---|---|
| 性能 | ゼロ埋め・CRC32・ZIP・テキストは JS 有利。パターン埋めのみ互角 |
| シンプルさ / 保守性 | JS が上（ビルド・FFI・境界コストが不要） |

詳細な計測条件・数値表・不採用理由はドキュメントを参照:

- [docs/ 一覧](./docs/README.md)
- [技術選定: JS vs MoonBit WASM](./docs/tech-selection-js-vs-moonbit-wasm.md)
- [サービス構想メモ](./docs/service-concept.md)

## ベンチの再現

前提: `moon`（MoonBit）、Node.js、pnpm。

```bash
pnpm bench          # WASM ビルド + 1/10/100MB フル計測
pnpm bench:quick    # 1MB, 10MB の短い確認
pnpm bench:serve    # ブラウザ UI (http://localhost:8765)
```

```
bench/                 # ベンチランナー（JS 実装・UI・Node CLI）
moonbit-bench/         # MoonBit wasm-gc ライブラリ
docs/                  # 検証記録・構想メモ
scripts/copy-wasm.mjs  # ビルド成果物を bench/ へコピー
```
