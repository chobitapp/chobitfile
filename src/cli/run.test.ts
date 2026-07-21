import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { isPngSignature } from "../generators";
import { runCli } from "./run";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "chobitfile-cli-"));
  tempDirs.push(dir);
  return dir;
}

describe("runCli", () => {
  it("TXT を生成してサイズ一致で書き出す", async () => {
    const cwd = await makeTempDir();
    const result = await runCli(
      ["generate", "-t", "txt", "-s", "1mb", "-q", "-o", "out.txt"],
      { cwd },
    );
    expect(result.exitCode).toBe(0);
    const out = path.join(cwd, "out.txt");
    const st = await stat(out);
    expect(st.size).toBe(1_048_576);
  });

  it("PNG シグネチャ付きで任意サイズを生成する", async () => {
    const cwd = await makeTempDir();
    const result = await runCli(
      ["-t", "png", "--bytes", "8192", "-q", "-o", "tiny.png"],
      { cwd },
    );
    expect(result.exitCode).toBe(0);
    const bytes = await readFile(path.join(cwd, "tiny.png"));
    expect(bytes.byteLength).toBe(8192);
    expect(isPngSignature(bytes)).toBe(true);
  });

  it("既存ファイルは --force なしで失敗する", async () => {
    const cwd = await makeTempDir();
    const first = await runCli(
      ["-t", "txt", "--bytes", "100", "-q", "-o", "a.txt"],
      {
        cwd,
      },
    );
    expect(first.exitCode).toBe(0);
    const second = await runCli(
      ["-t", "txt", "--bytes", "100", "-q", "-o", "a.txt"],
      { cwd },
    );
    expect(second.exitCode).toBe(1);
    const forced = await runCli(
      ["-t", "txt", "--bytes", "200", "-q", "-o", "a.txt", "--force"],
      { cwd },
    );
    expect(forced.exitCode).toBe(0);
    expect((await stat(path.join(cwd, "a.txt"))).size).toBe(200);
  });

  it("--dry-run はファイルを作らない", async () => {
    const cwd = await makeTempDir();
    const result = await runCli(
      ["-t", "pdf", "-s", "1mb", "--dry-run", "-o", "skip.pdf"],
      { cwd },
    );
    expect(result.exitCode).toBe(0);
    await expect(stat(path.join(cwd, "skip.pdf"))).rejects.toThrow();
  });
});
