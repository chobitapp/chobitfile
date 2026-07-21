# chobitfile MVP 仕様

最終更新: 2026-07-21

第一弾として提供する最小機能の決定事項を固定する。実装仕様の正本。

関連:

- [サービス構想メモ](./service-concept.md)
- [技術選定: JS vs MoonBit WASM](./tech-selection-js-vs-moonbit-wasm.md)

---

## 1. 目的

指定したサイズ・形式のダミーファイルを **ブラウザ内で生成** し、ダウンロードできるようにする。

想定ユースケース:

- ファイルアップロードのサイズ上限・境界値テスト
- 形式バリデーション（PNG / JPEG / PDF / Office / テキスト等として受理されるか）の確認

サーバー側での生成・保存・転送は行わない。

---

## 2. スコープ

### 2.1 含む（MVP）

| 項目 | 内容 |
|---|---|
| 形式 | PNG, JPEG, DOCX, XLSX, PPTX, PDF, TXT, CSV, JSON |
| サイズ選択肢 | 1 / 3 / 5 / 10 / 20 MB |
| サイズ単位 | 1024 系。`1 MB = 1,048,576` バイト |
| サイズ厳密性 | 生成ファイルのバイト数が目標値と **完全一致** |
| 境界モード | `exact`（ちょうど） / `under`（−1 バイト） / `over`（+1 バイト） |
| UI | 1 画面の設定パネル（形式・サイズ・境界 → 生成） |
| 生成場所 | ブラウザ（Web Worker） |
| 言語 | 日本語のみ |
| テーマ | ライト固定 |
| URL | クエリ双方向同期 |
| テスト | 生成器の単体テスト中心 |
| デプロイ | Cloudflare Workers（Static Assets）へ `wrangler` 手動デプロイ |
| 説明文 | クライアント生成である旨の短い注記 |

### 2.2 含まない（後回し）

- MP4 / MP3 などメディア形式
- サーバー生成・ストレージ・認証・課金
- アクセス解析・アプリ内イベント計測
- 日英 i18n・ダークモード切替
- UI の E2E（Playwright 等）
- CI 自動デプロイ
- 見た目のあるダミー画像・本文入り DOCX
- 任意オフセット入力や ±1KB などの追加境界

---

## 3. サイズと境界

### 3.1 ベースサイズ

| ラベル | バイト数 |
|---|---:|
| 1 MB | 1,048,576 |
| 3 MB | 3,145,728 |
| 5 MB | 5,242,880 |
| 10 MB | 10,485,760 |
| 20 MB | 20,971,520 |

UI にはラベルとバイト数を併記する（例: `1 MB（1,048,576 バイト）`）。

### 3.2 境界モード

目標バイト数 `T` をベースサイズとする。

| モード | 目標サイズ |
|---|---|
| `exact` | `T` |
| `under` | `T - 1` |
| `over` | `T + 1` |

生成後に `blob.size === 目標サイズ` を検証し、不一致ならエラーとする。

---

## 4. 形式仕様

### 4.1 PNG

- **有効 PNG** としてデコーダが受理できること
- ブラウザでは OffscreenCanvas でサイズ情報（MB・境界・バイト数）を描画したプレビュー画像をベースにする（Canvas 非対応環境は 1×1 最小 PNG にフォールバック）
- 目標サイズまでの不足分は **パディング用チャンク**（private / 補助チャンク等）で埋める
- チャンクの CRC-32 は仕様どおり正しく計算する
- プレビューは識別用の簡易表示でよい（高度なデザイン性は求めない）

### 4.2 JPEG

- **有効 JPEG** としてデコーダが受理できること
- ブラウザでは OffscreenCanvas でサイズ情報（MB・境界・バイト数）を描画したプレビュー画像をベースにする（Canvas 非対応環境は 1×1 最小 JPEG にフォールバック）
- 目標サイズまでの不足分は **COM セグメント**（コメント）で埋める
- ファイル末尾は EOI（`FF D9`）であること
- プレビューは識別用の簡易表示でよい（高度なデザイン性は求めない）

### 4.3 DOCX / XLSX / PPTX

- **最小有効 Office Open XML**（ZIP パッケージ）として各アプリ / LibreOffice 等が開けること
- 必須エントリ（`[Content_Types].xml`、リレーション、最小本文部品等）を正規に含める
- 目標サイズまでの不足分は ZIP 内の **ダミー部品（store / 無圧縮）** で調整する
- 本文の装飾や長文は求めない

### 4.4 PDF

- **最小有効 PDF** としてビューアが開けること（Catalog / Pages / Page、xref、trailer、`%%EOF`）
- 目標サイズまでの不足分は **未使用ストリームオブジェクト** の内容で埋める
- オフセット・Length・startxref は固定桁で組み立て、サイズ厳密一致を保証する

### 4.5 TXT / CSV / JSON

- バイト数が目標と完全一致すること
- TXT: プレーンテキスト（識別用ヘッダ + パディング文字）
- CSV: ヘッダ行 + 1 データ行（パディング列）。区切りを壊さない文字のみで埋める
- JSON: パース可能なオブジェクト。`padding` 文字列フィールドでサイズ調整

---

## 5. ファイル名

パターン:

```text
chobitfile-{sizeLabel}mb-{boundary}.{ext}
```

例:

- `chobitfile-10mb-exact.png`
- `chobitfile-1mb-under.docx`
- `chobitfile-5mb-over.pdf`
- `chobitfile-3mb-exact.json`

`sizeLabel` は 1 / 3 / 5 / 10 / 20。`boundary` は `exact` / `under` / `over`。

---

## 6. UI / UX

### 6.1 レイアウト

- 1 画面・設定パネル型
- コントロール: 形式（Selector・セクション分け） / サイズ / 境界モード / 生成ボタン
- 生成中は簡易プログレス（「生成中…」等）と操作の無効化
- 成功時は Blob をダウンロード（`a[download]` 等）。File System Access API は使わない
- 画面上部または近傍に、短い注記:

  > ファイルはブラウザ内で生成されます。サーバーには送信しません。

### 6.2 デフォルト

| 項目 | 初期値 |
|---|---|
| 形式 | PNG |
| サイズ | 1 MB |
| 境界 | exact |

### 6.3 URL クエリ

双方向同期する。

| キー | 値 |
|---|---|
| `type` | `png` / `jpeg` / `docx` / `xlsx` / `pptx` / `pdf` / `txt` / `csv` / `json` |
| `size` | `1` / `3` / `5` / `10` / `20` |
| `boundary` | `exact` / `under` / `over` |

例: `/?type=png&size=10&boundary=under`

不正・未知の値は無視し、該当項目をデフォルトにフォールバックする。

### 6.4 テーマ・言語

- 日本語のみ
- ライト固定（OS 追従・トグルなし）

---

## 7. 技術構成

| 層 | 選定 |
|---|---|
| アプリ枠 | Vite + React + TypeScript |
| UI | AstryX（`@astryxdesign/core`） |
| 生成ロジック | TypeScript（素の TypedArray / Blob）。MoonBit/WASM は使わない |
| 重い処理 | Web Worker |
| パッケージマネージャ | pnpm |
| Lint / Format | Biome |
| 単体テスト | Vitest（生成器中心） |
| ホスト | Cloudflare Workers + Static Assets |
| デプロイ | `wrangler` 手動（`pnpm deploy` 等） |
| URL 状態 | nuqs（`useQueryStates` + React SPA アダプタ） |
| セキュリティヘッダ | `public/_headers`（CSP / nosniff / frame 拒否 等） |
| 計測 | なし |

### 7.1 リポジトリ

- ルートをアプリ本体とする（`src/`, `index.html`, `wrangler.jsonc` 等）
- 既存の `bench/`・`moonbit-bench/`・`docs/` は技術選定の証跡として現状維持

### 7.2 モジュール指針

- 形式ごと: `src/generators/png.ts`, `src/generators/docx.ts` など
- OOXML 共有: `src/generators/ooxml.ts`（store ZIP + パディング）
- 共有: CRC32・バイト書き込み・サイズ計算ヘルパ
- Worker エントリから生成 API を呼ぶ
- UI は生成詳細を知らず、`type` / 目標バイト数 / ファイル名だけを渡す

---

## 8. テスト方針（MVP）

生成器の単体テストを中心にする。

最低限の検証:

1. 各形式 × 代表サイズ × 3 境界で **バイト数が目標と一致**
2. PNG: シグネチャ・IHDR / IEND 等の構造上の妥当性（必要最小）
3. JPEG: シグネチャ・EOI の妥当性
4. DOCX / XLSX / PPTX: ZIP ローカルファイルヘッダ等、最小限のパッケージ妥当性
5. PDF: `%PDF-` シグネチャ・`%%EOF`・必須キーワード
6. JSON: `JSON.parse` で受理されること
7. ファイル名ヘルパの出力

UI の E2E とデプロイ後のブラウザ手動確認は必須にしない（手動で足りる範囲）。

---

## 9. 非機能・運用

- プライバシー: 生成物をサーバーに送らない（静的配信のみ）
- アカウント・認証: なし
- CI 自動デプロイ: なし（手動 `wrangler deploy`）
- 解析: なし

---

## 10. 変更履歴

| 日付 | 内容 |
|---|---|
| 2026-07-21 | 初版。グリル結果に基づき MVP 決定を固定 |
| 2026-07-21 | 形式追加: JPEG / XLSX / PPTX / PDF / TXT / CSV / JSON |
