import { parseArgs } from "node:util";
import { MAX_TARGET_BYTES, targetBytesFor } from "../lib/sizes";
import {
  BOUNDARY_MODES,
  type BoundaryMode,
  DEFAULT_PARAMS,
  FILE_TYPES,
  type FileType,
  SIZE_MB_OPTIONS,
  type SizeMb,
} from "../lib/types";
import { parseSizeToBytes, tryParseWholeMibLabel } from "./parse-size";

export type CliArgs = {
  type: FileType;
  targetBytes: number;
  boundary: BoundaryMode;
  output: string | null;
  force: boolean;
  dryRun: boolean;
  quiet: boolean;
  help: boolean;
  /** デフォルトファイル名生成用 */
  sizeMbLabel: number | null;
  fromBytesFlag: boolean;
};

export class CliUsageError extends Error {
  readonly exitCode = 2;
}

function isFileType(value: string): value is FileType {
  return (FILE_TYPES as readonly string[]).includes(value);
}

function isBoundary(value: string): value is BoundaryMode {
  return (BOUNDARY_MODES as readonly string[]).includes(value);
}

export const CLI_HELP = `chobitfile — 指定サイズ・形式のダミーファイルをローカル生成

使い方:
  chobitfile generate [options]
  chobitfile [options]

Options:
  -t, --type <type>         形式: ${FILE_TYPES.join(" | ")}
                            (default: ${DEFAULT_PARAMS.type})
  -s, --size <size>         サイズ（1024 系）: 10mb / 512kb / 1048576
                            任意サイズ可。上限 ${MAX_TARGET_BYTES.toLocaleString("en-US")} bytes（Web と同じ）
                            (default: ${DEFAULT_PARAMS.sizeMb}mb)
      --bytes <n>           目標バイト数を直接指定（--size / --boundary と併用不可）
  -b, --boundary <mode>     exact | under | over（--size 時のみ）
                            (default: ${DEFAULT_PARAMS.boundary})
  -o, --output <path>       出力パス。- で stdout
                            (default: カレントのデフォルトファイル名)
  -f, --force               既存ファイルを上書き
      --dry-run             生成せず、計画だけ表示
  -q, --quiet               進捗メッセージを出さない
  -h, --help                ヘルプ

例:
  chobitfile generate -t png -s 10mb -b exact
  chobitfile generate -t pdf --bytes 1234567 -o ./out.pdf
  chobitfile generate -t json -s 1mb -o -
`;

/**
 * process.argv 相当（node / スクリプト以降）から CLI 引数を解釈する。
 * `generate` サブコマンドは省略可能。
 */
export function parseCliArgs(argv: string[]): CliArgs {
  // generate を先頭から剥がす（あってもなくてもよい）
  const tokens = [...argv];
  if (tokens[0] === "generate") {
    tokens.shift();
  }

  let parsed: ReturnType<typeof parseArgs>;
  try {
    parsed = parseArgs({
      args: tokens,
      options: {
        type: { type: "string", short: "t" },
        size: { type: "string", short: "s" },
        bytes: { type: "string" },
        boundary: { type: "string", short: "b" },
        output: { type: "string", short: "o" },
        force: { type: "boolean", short: "f", default: false },
        "dry-run": { type: "boolean", default: false },
        quiet: { type: "boolean", short: "q", default: false },
        help: { type: "boolean", short: "h", default: false },
      },
      allowPositionals: true,
      strict: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CliUsageError(message);
  }

  if (parsed.positionals.length > 0) {
    throw new CliUsageError(
      `不明な引数: ${parsed.positionals.join(" ")}。chobitfile --help を参照してください`,
    );
  }

  const values = parsed.values;
  if (values.help) {
    return {
      type: DEFAULT_PARAMS.type,
      targetBytes: 0,
      boundary: DEFAULT_PARAMS.boundary,
      output: null,
      force: false,
      dryRun: false,
      quiet: false,
      help: true,
      sizeMbLabel: null,
      fromBytesFlag: false,
    };
  }

  const typeRaw = values.type ?? DEFAULT_PARAMS.type;
  if (!isFileType(typeRaw)) {
    throw new CliUsageError(
      `不正な形式: ${typeRaw}（${FILE_TYPES.join(", ")}）`,
    );
  }

  const hasBytes = values.bytes !== undefined;
  const hasSize = values.size !== undefined;
  const hasBoundaryFlag = values.boundary !== undefined;

  if (hasBytes && (hasSize || hasBoundaryFlag)) {
    throw new CliUsageError(
      "--bytes は --size / --boundary と同時に指定できません",
    );
  }

  const boundaryRaw = values.boundary ?? DEFAULT_PARAMS.boundary;
  if (!isBoundary(boundaryRaw)) {
    throw new CliUsageError(
      `不正な境界: ${boundaryRaw}（${BOUNDARY_MODES.join(", ")}）`,
    );
  }

  let targetBytes: number;
  let sizeMbLabel: number | null = null;
  let fromBytesFlag = false;

  if (hasBytes) {
    fromBytesFlag = true;
    const n = Number(values.bytes);
    if (!Number.isInteger(n) || n <= 0) {
      throw new CliUsageError(`不正な --bytes: ${values.bytes}`);
    }
    targetBytes = n;
  } else {
    const sizeRaw = values.size ?? `${DEFAULT_PARAMS.sizeMb}mb`;
    let baseBytes: number;
    try {
      baseBytes = parseSizeToBytes(sizeRaw);
    } catch (error) {
      throw new CliUsageError(
        error instanceof Error ? error.message : String(error),
      );
    }
    sizeMbLabel = tryParseWholeMibLabel(sizeRaw);

    // Web プリセット SizeMb は共通関数で境界適用（経路を揃える）
    if (
      sizeMbLabel !== null &&
      (SIZE_MB_OPTIONS as readonly number[]).includes(sizeMbLabel)
    ) {
      targetBytes = targetBytesFor(sizeMbLabel as SizeMb, boundaryRaw);
    } else {
      switch (boundaryRaw) {
        case "exact":
          targetBytes = baseBytes;
          break;
        case "under":
          targetBytes = baseBytes - 1;
          break;
        case "over":
          targetBytes = baseBytes + 1;
          break;
      }
    }
  }

  if (targetBytes <= 0 || !Number.isInteger(targetBytes)) {
    throw new CliUsageError(`目標バイト数が不正です: ${targetBytes}`);
  }
  if (targetBytes > MAX_TARGET_BYTES) {
    throw new CliUsageError(
      `目標サイズが上限を超えています: ${targetBytes}（最大 ${MAX_TARGET_BYTES}。Web と同じ）`,
    );
  }

  return {
    type: typeRaw,
    targetBytes,
    boundary: boundaryRaw,
    output: values.output ?? null,
    force: values.force ?? false,
    dryRun: values["dry-run"] ?? false,
    quiet: values.quiet ?? false,
    help: false,
    sizeMbLabel,
    fromBytesFlag,
  };
}
