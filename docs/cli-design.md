# chobitfile CLI 設計検討

最終更新: 2026-07-21

Web 版とロジックを共通化した CLI 版の形式・配布・リポジトリ構成の検討メモ。
実装仕様の正本ではなく、方針決定用の提案である。

関連:

- [MVP 仕様](./mvp-spec.md)
- [サービス構想メモ](./service-concept.md)

---

## 1. なぜ CLI か

Web 版の主用途は「ブラウザで 1 ファイルを作ってダウンロード」。CLI が効く場面は別にある。

| ユースケース | Web | CLI |
|---|---|---|
| 手動で境界値ファイルを 1 つ欲しい | ○ | ○ |
| E2E / 結合テストのフィクスチャ生成 | △（手動） | ○ |
| CI で毎回同じサイズの PDF を作る | × | ○ |
| 複数サイズ × 境界の一括生成 | × | ○ |
| プリセット外の任意バイト数 | ×（現状） | ○（差別化） |
| Node 不要・ゼロインストール | ○ | 配布次第 |

CLI は Web の代替ではなく **自動化・再現性・任意サイズ** を足す位置づけが自然。

生成は引き続きローカル完結（サーバー生成しない）。プライバシーと帯域ゼロの思想は Web と揃える。

---

## 2. 現状コードと共有境界

### 2.1 すでに Node 互換に近い層

| 層 | パス | 状態 |
|---|---|---|
| 生成器本体 | `src/generators/*` | `Uint8Array` 中心。DOM 非依存（後述を除く） |
| サイズ計算 | `src/lib/sizes.ts` | pure |
| 型・定数 | `src/lib/types.ts` | pure |
| ファイル名 | `src/lib/filename.ts` | pure |
| バリデーション | `src/worker/validate-request.ts` | pure（Worker 専用ではない） |
| 単体テスト | Vitest `environment: "node"` | 生成器は既に Node で通っている |

### 2.2 ブラウザ専用層（共有しない）

| 層 | パス | 理由 |
|---|---|---|
| React UI | `src/App.tsx`, hooks, styles | DOM |
| ダウンロード | `src/lib/download.ts` | `document` / `URL.createObjectURL` |
| URL クエリ | `src/lib/query.ts` + nuqs | ブラウザ履歴 |
| Web Worker 配線 | `src/worker/generate.worker.ts`, `useGenerateFile` | `postMessage` / `Worker` |
| 画像ラベル描画 | `src/generators/image-label.ts` の `OffscreenCanvas` | ブラウザ API。**既に未対応環境では `null` フォールバック** |

結論: **コア生成 API を薄い pure 層として切り出せば、CLI はほぼその上に I/O を載せるだけ**。PNG/JPEG のラベル付きプレビューは CLI では最小画像フォールバックでよい（テスト用途ではシグネチャとサイズ一致が重要）。

### 2.3 共有 API の形（提案）

UI / CLI 双方が呼ぶ「ドメイン API」を明示する。

```ts
// 概念イメージ（現状 generateFile + sizes + filename の束ね）
type GenerateInput = {
  type: FileType;
  /** 目標バイト数。境界適用後の最終値 */
  targetBytes: number;
  /** 省略時は imageLabel なし → 最小 PNG/JPEG */
  imageLabel?: ImageLabel;
};

type GenerateResult = {
  bytes: Uint8Array;
  filename: string; // デフォルト名。出力パスはアダプタ側
  mimeType: string;
};

async function generate(input: GenerateInput): Promise<GenerateResult>
function resolveTargetBytes(sizeMb: SizeMb, boundary: BoundaryMode): number
function buildFilename(...): string
```

Web: Worker 内で `generate` → Blob ダウンロード。  
CLI: `generate` → `fs.writeFile` / stdout。

サイズ厳密一致の検証（`bytes.byteLength === targetBytes`）は **コア側で一度** 行い、二重実装を避ける。

---

## 3. リポジトリ構成の選択肢

### 案 A: 単一パッケージ + `bin`（推奨・第一段）

```text
src/
  core/          # generators, lib(sizes/types/filename/bytes/crc32), 共有 generate API
  web/           # React, worker, download, query
  cli/           # エントリ・引数パース・ファイル書き出し
package.json     # "bin": { "chobitfile": "dist-cli/index.js" }
```

| 長所 | 短所 |
|---|---|
| 移動コストが最小 | Web 用依存が CLI 利用者の lockfile に混ざる可能性 |
| テスト・型を 1 リポジトリのまま | npm 公開時に `private: false` と publish 範囲の整理が必要 |
| 現状の Vite/Vitest に近い | パッケージ境界が曖昧になりやすい（`core` ディレクトリ規約で抑える） |

**いまの規模（生成器 9 形式・依存も軽い）では案 A が妥当。** monorepo 分割はパッケージ公開方針が固まったあとの第二段でよい。

### 案 B: pnpm workspace で packages 分割

```text
packages/core   # 公開可能: @chobitfile/core or chobitfile の lib
packages/web    # Cloudflare デプロイ用 SPA
packages/cli    # bin: chobitfile
```

| 長所 | 短所 |
|---|---|
| 依存分離がきれい | 初期セットアップと path alias / ビルドが増える |
| core だけライブラリ利用できる | 現状は過剰になりやすい |

ライブラリとして他プロジェクトから `import { generateFile } from "chobitfile"` したい需要が明確なら B。

### 案 C: コアを別言語 / WASM

MoonBit 検証済みで「JS で十分」と既に結論済み。CLI のためだけにコアを書き直す理由はない。**TypeScript のまま共有**する。

---

## 4. CLI の形式（UX）

### 4.1 設計方針

1. **スクリプト向き**（非対話・終了コード・stdout/stderr 分離）を優先
2. Web の語彙（`type` / `size` / `boundary`）を踏襲し、学習コストを下げる
3. CLI 固有の価値として **任意バイト数・出力パス・一括生成** を足す
4. 破壊的デフォルトを避ける（上書きは `--force`）

### 4.2 コマンド案

サブコマンドは 1 つに絞る（`generate`）。ツール全体が「生成」なので、将来 `chobitfile` 直下にフラグを載せるエイリアスも可。

```bash
# 基本（Web と同じ語彙）
chobitfile generate --type png --size 10mb --boundary exact

# 短い形
chobitfile generate -t pdf -s 1mb -b under -o ./fixtures/limit.pdf

# 任意バイト数（CLI の差別化）
chobitfile generate -t json --bytes 1234567 -o out.json

# 標準出力（パイプ用）。進捗は stderr
chobitfile generate -t txt -s 1mb -o -

# 一括（テストマトリクス）
chobitfile generate -t png,pdf -s 1mb,10mb -b exact,under,over -o ./fixtures/
# → fixtures/chobitfile-1mb-exact.png など

# ドライラン（目標サイズとファイル名だけ表示）
chobitfile generate -t png -s 10mb --dry-run
```

### 4.3 フラグ一覧（提案）

| フラグ | 説明 | デフォルト |
|---|---|---|
| `-t, --type` | 形式。カンマ区切りで複数可 | 必須（または `-o` の拡張子から推論） |
| `-s, --size` | `1mb` / `10MB` / `512kb` 等。Web プリセット外も可 | `--bytes` と排他で片方必須 |
| `--bytes` | 目標バイト数を直接指定 | — |
| `-b, --boundary` | `exact` / `under` / `over`。`--size` 時のみ意味を持つ | `exact` |
| `-o, --output` | ファイルパス / ディレクトリ / `-`（stdout） | カレントにデフォルトファイル名 |
| `-f, --force` | 既存ファイル上書き | off |
| `--dry-run` | 生成せず計画だけ表示 | off |
| `-q, --quiet` | stderr の進捗を抑制 | off |
| `--no-label` | PNG/JPEG でもラベル描画を試みない（常に最小ベース） | CLI ではデフォルトで label なしでよい |

**Web との差分（意図的）:**

- CLI の `--size` は `1mb|3mb|5mb|10mb|20mb` に限定しない（例: `2mb`, `512kb`, `1000000`）。
- `--boundary` は「人間が言う 10MB の ±1」用。`--bytes` 指定時は boundary を無視（またはエラー）。
- Web のプリセット UI はそのまま維持し、CLI だけ自由度を上げる。

### 4.4 サイズ表記パーサ

```text
12345        → 12345 バイト
512kb / 512k → 512 * 1024
10mb / 10m   → 10 * 1024 * 1024
1gb          → 要上限議論（後述）
```

単位は **1024 系（MiB 相当を mb と書く）** で Web と揃える。SI（1000 系）は混乱のもとなので採用しない。ヘルプに「1mb = 1,048,576 bytes」と明記。

### 4.5 終了コード

| コード | 意味 |
|---|---|
| 0 | 成功 |
| 1 | 生成失敗・サイズ不一致・I/O エラー |
| 2 | 引数不正 |

### 4.6 引数パーサの実装候補

| ライブラリ | 評価 |
|---|---|
| **自前 + `util.parseArgs`（Node 18+）** | 依存ゼロ。フラグが単純なら十分 |
| citty / commander / yargs | ヘルプ・サブコマンドが楽。依存増 |

第一段は **`node:util` の `parseArgs`** で足りる可能性が高い。ヘルプ文面を手書きするコストとトレードオフ。

### 4.7 Node バージョン

生成器は modern TS だがランタイム要件は低い。**Node 20 LTS 以上** を目安にすれば十分（Cloudflare/開発環境とも乖離しにくい）。

---

## 5. 配布方法の選択肢

### 5.1 比較

| 方式 | 利用者の手間 | メンテコスト | 向いている相手 |
|---|---|---|---|
| **npm / `npx chobitfile`** | 低（Node があれば） | 低 | フロント・QA・CI（本命） |
| **pnpm/npm global install** | 低 | 低（上と同じパッケージ） | 常用する人 |
| GitHub Releases の単一バイナリ | 中 | 中（クロスビルド・署名） | Node を入れたくない人 |
| Homebrew | 中 | 中（tap 運用） | macOS ヘビーユーザー |
| ソースから `pnpm` 実行のみ | 高 | 最低 | コントリビュータ |

想定ユーザーは「アップロード上限を試す Web 開発者・QA」なので、**Node 前提の npm 配布が最短距離**。

### 5.2 推奨: npm パッケージ（第一段）

```json
{
  "name": "chobitfile",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "chobitfile": "./dist-cli/index.js"
  },
  "files": ["dist-cli", "README.md"],
  "engines": { "node": ">=20" }
}
```

利用例:

```bash
npx chobitfile generate -t pdf -s 10mb -o ./10mb.pdf
pnpm dlx chobitfile generate -t png -s 1mb -b under
```

ビルド:

- CLI は **esbuild / tsdown 等で 1 ファイルにバンドル**（依存を同梱し、`node_modules` 解決に依存しにくくする）
- Web は現行どおり Vite → Cloudflare
- `private: true` のままだと publish できない → 公開時に解除、または `publishConfig` で整理

パッケージ名 `chobitfile` の npm 空き状況は公開前に確認する。取れなければ `@nanabit/chobitfile` 等のスコープ付き。

### 5.3 第二段候補: 単一バイナリ

需要が出たら:

| 手段 | メモ |
|---|---|
| Bun `--compile` | 手軽。配布ターゲットを絞れる |
| Node SEA (Single Executable Applications) | 公式だが手順が重い |
| deno compile | ランタイム移行コスト |

現状ロジックが pure JS なので **後からバイナリ化しやすい**。第一段で npm を出し、Issue で「Node なし版が欲しい」が出てからでよい。

### 5.4 やらない方がよいこと（現時点）

- **サーバー API として生成をホストする** — 帯域・ストレージ・悪用リスクが増え、プロダクト思想と逆
- **Homebrew を初手で用意** — npm で十分な層に届く前の運用コスト
- **Python/Go で CLI だけ書き直し** — ロジック二重管理になる

---

## 6. 上限・安全策（CLI 固有）

Web は UI で 20MB まで。CLI は `--bytes` で実質無制限になり得る。

提案:

| 項目 | 案 |
|---|---|
| デフォルト上限 | 例: 100 MiB（`MAX_TARGET_BYTES` をコアで共有し CLI だけ緩められる構造） |
| 引き上げ | `--max-bytes` または環境変数 `CHOBITFILE_MAX_BYTES` |
| メモリ | 現状実装は目標サイズ相当をメモリに載せる前提。巨大ファイルは将来ストリーミング化が必要、とヘルプに注意書き |
| 上書き | デフォルト拒否、`--force` で許可 |
| stdout | バイナリを出すときは進捗を stderr のみ。TTY 判定で誤ってターミナルに巨大バイナリを吐かない警告も検討 |

---

## 7. 段階的ロードマップ

### Phase 0 — 共有境界の整理（実装の土台）

1. `src/generators` + pure な `src/lib/*` を「コア」として依存方向を固定  
   - コア → UI/CLI を import しない  
   - UI/CLI → コアのみ
2. `generateFile` + サイズ一致検証 + `buildFilename` + `MIME_TYPES` を一つの入口にまとめる（薄い facade）
3. `validate-request` を worker 専用名から「入力バリデーション」へ寄せるか、CLI は別バリデータを持つ（重複最小に）

### Phase 1 — CLI MVP

1. `src/cli` + `parseArgs`
2. `generate` サブコマンド（単一 type / size|bytes / boundary / output）
3. デフォルトファイル名は Web と同じ `chobitfile-{n}mb-{boundary}.{ext}`。`--bytes` 時は `chobitfile-{bytes}b.{ext}` など別規則
4. Vitest に CLI の引数→目標バイト数のユニット、または `node dist-cli ...` のスモーク
5. README に CLI 節を追加

### Phase 2 — 配布

1. npm 名確定・`private` 解除・`files` / `bin` 整備
2. GitHub Actions で tag 時に `npm publish`（任意）
3. Web のデプロイパイプラインとは独立

### Phase 3 — 拡張（需要ベース）

- 複数 type/size/boundary の一括生成
- ライブラリ export（`import { generateFile } from "chobitfile"`）
- monorepo 分割（案 B）
- 単一バイナリ
- 任意サイズを Web UI にも足すかは別議論（MVP 仕様の変更になる）

---

## 8. Web 仕様書との関係

- [MVP 仕様](./mvp-spec.md) は **Web 第一弾の正本のまま**でよい。
- CLI は「同じ生成器・同じ形式保証・ローカル生成」を共有し、**サイズ入力の自由度と I/O だけが拡張**。
- CLI を公式サポートする段階で、MVP 仕様に「CLI は別文書 / 別セクション」を追記する。

---

## 9. 推奨まとめ

| 項目 | 推奨 |
|---|---|
| ロジック共有 | TypeScript の pure コアを切り出し。WASM/別言語にしない |
| リポジトリ | 第一段は単一パッケージ + `src/core` / `src/web` / `src/cli` |
| CLI UX | `chobitfile generate -t … -s …|-b …|--bytes … -o …`。非対話・スクリプト優先 |
| Web との差分 | CLI は任意サイズ・一括・stdout。画像ラベルはデフォルトなし |
| 配布 | 第一段は **npm + npx/pnpm dlx**。バイナリ/Homebrew は需要後 |
| 上限 | 明示上限 + 上書き保護。巨大ファイルはメモリ注意をドキュメント化 |

---

## 10. 決定が必要な論点

実装に入る前に固めるとよい点:

1. **npm 公開するか**（個人利用の bin だけ / 公開パッケージ）
2. **パッケージ名**（`chobitfile` vs スコープ付き）
3. **CLI のデフォルト上限**（20MB のまま / 100MB / 別）
4. **任意サイズを Web にも後から足すか**（CLI のみでよいか）
5. **一括生成を MVP に含めるか**（単発だけ先でも価値はある）

---

## 11. 変更履歴

| 日付 | 内容 |
|---|---|
| 2026-07-21 | 初版。Web/CLI 共有境界・CLI UX・配布・段階案を整理 |
