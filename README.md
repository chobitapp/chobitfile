# chobitfile

指定サイズ・形式のダミーファイルを **ローカルで生成** するツール（Web / CLI）。

対応形式: **PNG / JPEG / DOCX / XLSX / PPTX / PDF / TXT / CSV / JSON**。  
サイズ上限は **20 MB + 1 バイト**（1024 系）。境界 **ちょうど / −1 / +1 バイト**。

- Web: https://chobitfile.nanabit.dev （ブラウザ内生成）
- CLI: npm の `chobitfile`（同じ生成ロジック）

## CLI

```bash
# 一度だけ / CI
npx chobitfile generate -t pdf -s 10mb -b exact -o ./10mb.pdf
pnpm dlx chobitfile -t png -s 1mb -b under

# グローバル
npm i -g chobitfile
chobitfile -t json --bytes 1234567 -o out.json
```

| よく使うオプション | 説明 |
|---|---|
| `-t, --type` | 形式（default: `png`） |
| `-s, --size` | `10mb` / `512kb` / 生バイト。**プリセット外の任意サイズ可** |
| `--bytes` | 目標バイト数を直接指定（`-s` / `-b` と排他） |
| `-b, --boundary` | `exact` / `under` / `over`（default: `exact`） |
| `-o, --output` | 出力パス。`-` で stdout |
| `-f, --force` | 上書き |
| `--dry-run` | 生成せず計画のみ表示 |

デフォルトは Web と同じ（PNG / 1MB / exact）。ヘルプ: `chobitfile --help`

## Web 開発

```bash
pnpm install
pnpm dev          # 開発サーバ
pnpm test         # 生成器・CLI の単体テスト
pnpm build        # Web: dist/ へビルド
pnpm build:cli    # CLI: dist-cli/ へバンドル
pnpm deploy       # ビルド後、Cloudflare Workers へ手動デプロイ
```

デプロイ前に `wrangler login` が必要です。

## ドキュメント

- [MVP 仕様](./docs/mvp-spec.md)（スコープ・サイズ・UI・技術の正本）
- [CLI 設計検討](./docs/cli-design.md)（Web 共有コア・CLI UX・配布）
- [docs 一覧](./docs/README.md)
- [技術選定: JS vs MoonBit WASM](./docs/tech-selection-js-vs-moonbit-wasm.md)
- [サービス構想メモ](./docs/service-concept.md)

## 技術構成

| 項目 | 内容 |
|---|---|
| アプリ | Vite + React + TypeScript |
| UI | AstryX |
| 生成 | TypeScript（Web: Worker / CLI: Node） |
| CLI 配布 | npm（esbuild 単一ファイル） |
| ホスト（Web） | Cloudflare Workers Static Assets |
| Lint | Biome |
| テスト | Vitest |

## ベンチ（技術選定の証跡）

```bash
pnpm bench          # WASM ビルド + 1/10/100MB フル計測
pnpm bench:quick    # 1MB, 10MB の短い確認
pnpm bench:serve    # ブラウザ UI (http://localhost:8765)
```

```
src/                   # アプリ本体（generators / web / cli）
  generators/          # Web・CLI 共通の生成ロジック
  cli/                 # CLI エントリ
bench/                 # ベンチランナー
moonbit-bench/         # MoonBit wasm-gc（選定検証用・未使用）
docs/                  # 仕様・検証記録
```
