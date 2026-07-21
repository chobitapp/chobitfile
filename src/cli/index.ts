import { runCli } from "./run";

const argv = process.argv.slice(2);

runCli(argv)
  .then((result) => {
    process.exitCode = result.exitCode;
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Fatal error: ${message}\n`);
    process.exitCode = 1;
  });
