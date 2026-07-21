import { access, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateFile } from "../generators";
import { MIME_TYPES } from "../lib/types";
import { CLI_HELP, type CliArgs, CliUsageError, parseCliArgs } from "./args";
import { buildCliFilename } from "./filename";

export type RunResult = {
  exitCode: number;
  /** Test helper: written path (null when stdout) */
  outputPath: string | null;
  targetBytes: number;
  filename: string;
};

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function logInfo(quiet: boolean, message: string): void {
  if (!quiet) {
    process.stderr.write(`${message}\n`);
  }
}

export async function runCli(
  argv: string[],
  options?: {
    cwd?: string;
    stdout?: NodeJS.WritableStream;
    stderr?: NodeJS.WritableStream;
  },
): Promise<RunResult> {
  const cwd = options?.cwd ?? process.cwd();

  let args: CliArgs;
  try {
    args = parseCliArgs(argv);
  } catch (error) {
    if (error instanceof CliUsageError) {
      process.stderr.write(`${error.message}\n`);
      return {
        exitCode: error.exitCode,
        outputPath: null,
        targetBytes: 0,
        filename: "",
      };
    }
    throw error;
  }

  if (args.help) {
    process.stdout.write(`${CLI_HELP}\n`);
    return {
      exitCode: 0,
      outputPath: null,
      targetBytes: 0,
      filename: "",
    };
  }

  const filename = buildCliFilename({
    type: args.type,
    targetBytes: args.targetBytes,
    boundary: args.boundary,
    sizeMbLabel: args.sizeMbLabel,
    fromBytesFlag: args.fromBytesFlag,
  });

  const outputSpec = args.output;
  const toStdout = outputSpec === "-";
  let outputPath: string | null = null;
  if (!toStdout) {
    outputPath = path.resolve(cwd, outputSpec ?? filename);
  }

  if (args.dryRun) {
    const dest = toStdout ? "(stdout)" : (outputPath ?? filename);
    process.stdout.write(
      `${[
        `type: ${args.type}`,
        `targetBytes: ${args.targetBytes}`,
        `mimeType: ${MIME_TYPES[args.type]}`,
        `filename: ${filename}`,
        `output: ${dest}`,
      ].join("\n")}\n`,
    );
    return {
      exitCode: 0,
      outputPath,
      targetBytes: args.targetBytes,
      filename,
    };
  }

  if (outputPath !== null && !args.force && (await pathExists(outputPath))) {
    process.stderr.write(
      `File already exists (use --force to overwrite): ${outputPath}\n`,
    );
    return {
      exitCode: 1,
      outputPath,
      targetBytes: args.targetBytes,
      filename,
    };
  }

  logInfo(
    args.quiet,
    `Generating: ${args.type} / ${args.targetBytes.toLocaleString("en-US")} bytes …`,
  );

  try {
    const bytes = await generateFile(args.type, args.targetBytes);
    if (bytes.byteLength !== args.targetBytes) {
      throw new Error(
        `Generated size mismatch: expected ${args.targetBytes}, got ${bytes.byteLength}`,
      );
    }

    if (toStdout) {
      const stdout = options?.stdout ?? process.stdout;
      stdout.write(bytes);
    } else if (outputPath !== null) {
      await writeFile(outputPath, bytes);
    }

    logInfo(
      args.quiet,
      toStdout
        ? `Done: ${args.targetBytes.toLocaleString("en-US")} bytes → stdout`
        : `Done: ${outputPath} (${args.targetBytes.toLocaleString("en-US")} bytes)`,
    );

    return {
      exitCode: 0,
      outputPath,
      targetBytes: args.targetBytes,
      filename,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${message}\n`);
    return {
      exitCode: 1,
      outputPath,
      targetBytes: args.targetBytes,
      filename,
    };
  }
}
