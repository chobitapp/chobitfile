# chobitfile

Generate dummy files of a given size and format.

Formats: PNG / JPEG / DOCX / XLSX / PPTX / PDF / TXT / CSV / JSON  
Max size: 20 MB

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
