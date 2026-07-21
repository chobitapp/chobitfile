# chobitfile

指定サイズ・形式のダミーファイルを生成するツール。

対応形式: PNG / JPEG / DOCX / XLSX / PPTX / PDF / TXT / CSV / JSON
サイズ上限: 20 MB

- Web: https://chobitfile.nanabit.dev （日本語 / 英語。`?lang=en` で英語）
- CLI: `chobitfile`（メッセージは英語固定）

## CLI

```bash
# 10MBのPDFファイルを生成
npx chobitfile -t pdf -s 10mb -o ./10mb.pdf

# グローバルにインストール
npm i -g chobitfile
```

| オプション       | 説明                                                                          |
| ---------------- | ----------------------------------------------------------------------------- |
| `-t, --type`     | 形式（default: `png`）                                                        |
| `-s, --size`     | `10mb` / `512kb` など任意のサイズ                                             |
| `-b, --boundary` | `exact` ぴったり / `under` 1byte少ない / `over` 1byte多い（default: `exact`） |
| `--bytes`        | バイト数で直接指定（`-s` / `-b` と排他）                                      |
| `-o, --output`   | 出力パス。`-` で stdout                                                       |
| `-f, --force`    | 上書き                                                                        |
| `--dry-run`      | 生成せず計画のみ表示                                                          |

ヘルプ: `chobitfile --help`
