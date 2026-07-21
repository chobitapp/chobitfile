# chobitfile

指定サイズ・形式のダミーファイルを **ブラウザ側で生成** するツール。

対応形式: **PNG / JPEG / DOCX / XLSX / PPTX / PDF / TXT / CSV / JSON**。サイズ **1 / 3 / 5 / 10 / 20 MB**（1024 系）、境界 **ちょうど / −1 / +1 バイト**。

## 使い方

```bash
pnpm install
pnpm dev          # 開発サーバ
pnpm test         # 生成器の単体テスト
pnpm build        # dist/ へビルド
pnpm deploy       # ビルド後、Cloudflare Workers へ手動デプロイ
```

デプロイ前に `wrangler login` が必要です。

## ドキュメント

- [MVP 仕様](./docs/mvp-spec.md)（スコープ・サイズ・UI・技術の正本）
- [docs 一覧](./docs/README.md)
- [技術選定: JS vs MoonBit WASM](./docs/tech-selection-js-vs-moonbit-wasm.md)
- [サービス構想メモ](./docs/service-concept.md)

## 技術構成（MVP）

| 項目 | 内容 |
|---|---|
| アプリ | Vite + React + TypeScript |
| UI | AstryX |
| 生成 | ブラウザ内 JS（Web Worker） |
| ホスト | Cloudflare Workers Static Assets |
| Lint | Biome |
| テスト | Vitest（生成器中心） |

## ベンチ（技術選定の証跡）

```bash
pnpm bench          # WASM ビルド + 1/10/100MB フル計測
pnpm bench:quick    # 1MB, 10MB の短い確認
pnpm bench:serve    # ブラウザ UI (http://localhost:8765)
```

```
src/                   # アプリ本体
bench/                 # ベンチランナー
moonbit-bench/         # MoonBit wasm-gc（選定検証用・MVP では未使用）
docs/                  # 仕様・検証記録
```
