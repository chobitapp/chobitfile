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
  /** For default filename generation */
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

export const CLI_HELP = `chobitfile — generate dummy files of a given size and format locally

Usage:
  chobitfile generate [options]
  chobitfile [options]

Options:
  -t, --type <type>         Format: ${FILE_TYPES.join(" | ")}
                            (default: ${DEFAULT_PARAMS.type})
  -s, --size <size>         Size (1024-based): 10mb / 512kb / 1048576
                            Any size allowed. Max ${MAX_TARGET_BYTES.toLocaleString("en-US")} bytes (same as Web)
                            (default: ${DEFAULT_PARAMS.sizeMb}mb)
      --bytes <n>           Target byte size directly (cannot combine with --size / --boundary)
  -b, --boundary <mode>     exact | under | over (with --size only)
                            (default: ${DEFAULT_PARAMS.boundary})
  -o, --output <path>       Output path. Use - for stdout
                            (default: default filename in cwd)
  -f, --force               Overwrite existing file
      --dry-run             Print plan without generating
  -q, --quiet               Suppress progress messages
  -h, --help                Show help

Examples:
  chobitfile generate -t png -s 10mb -b exact
  chobitfile generate -t pdf --bytes 1234567 -o ./out.pdf
  chobitfile generate -t json -s 1mb -o -
`;

/**
 * Parse argv after node/script.
 * The `generate` subcommand is optional.
 */
export function parseCliArgs(argv: string[]): CliArgs {
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
      `Unknown argument(s): ${parsed.positionals.join(" ")}. See chobitfile --help`,
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
      `Invalid type: ${typeRaw} (expected ${FILE_TYPES.join(", ")})`,
    );
  }

  const hasBytes = values.bytes !== undefined;
  const hasSize = values.size !== undefined;
  const hasBoundaryFlag = values.boundary !== undefined;

  if (hasBytes && (hasSize || hasBoundaryFlag)) {
    throw new CliUsageError(
      "--bytes cannot be combined with --size / --boundary",
    );
  }

  const boundaryRaw = values.boundary ?? DEFAULT_PARAMS.boundary;
  if (!isBoundary(boundaryRaw)) {
    throw new CliUsageError(
      `Invalid boundary: ${boundaryRaw} (expected ${BOUNDARY_MODES.join(", ")})`,
    );
  }

  let targetBytes: number;
  let sizeMbLabel: number | null = null;
  let fromBytesFlag = false;

  if (hasBytes) {
    fromBytesFlag = true;
    const n = Number(values.bytes);
    if (!Number.isInteger(n) || n <= 0) {
      throw new CliUsageError(`Invalid --bytes: ${values.bytes}`);
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

    // Align Web presets with shared boundary helper
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
    throw new CliUsageError(`Invalid target bytes: ${targetBytes}`);
  }
  if (targetBytes > MAX_TARGET_BYTES) {
    throw new CliUsageError(
      `Target size exceeds limit: ${targetBytes} (max ${MAX_TARGET_BYTES}, same as Web)`,
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
