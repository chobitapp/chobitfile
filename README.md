# chobitfile

Generate dummy files of a given size and format.

Formats: PNG / JPEG / DOCX / XLSX / PPTX / PDF / TXT / CSV / JSON  
Max size: 100 MB

- Web: https://chobitfile.nanabit.dev
- CLI: `chobitfile`

## CLI

```bash
# Generate a 10MB PDF
npx chobitfile -t pdf -s 10mb -o ./10mb.pdf

# Install globally
npm i -g chobitfile
```

| Option           | Description                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| `-t, --type`     | Format (default: `png`)                                                     |
| `-s, --size`     | Any size such as `10mb` / `512kb`                                           |
| `-b, --boundary` | `exact` / `under` (−1 byte) / `over` (+1 byte) (default: `exact`)           |
| `--bytes`        | Target size in bytes (mutually exclusive with `-s` / `-b`)                  |
| `-o, --output`   | Output path. Use `-` for stdout                                             |
| `-f, --force`    | Overwrite existing file                                                     |
| `--dry-run`      | Print plan without generating                                               |

Help: `chobitfile --help`

## Development and CI

Use Node.js 26 and pnpm 11.22.0 (pinned in `package.json`).

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
pnpm build:cli
```

GitHub Actions runs these checks on pull requests, pushes to `main`, and manual
dispatches. All actions are pinned to full commit SHAs with version comments.
No repository secrets are required.
