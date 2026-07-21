import { describe, expect, it } from "vitest";
import { MAX_TARGET_BYTES } from "../lib/sizes";
import { CliUsageError, parseCliArgs } from "./args";

describe("parseCliArgs", () => {
  it("デフォルトは Web と同じ（png / 1mb / exact）", () => {
    const args = parseCliArgs([]);
    expect(args.type).toBe("png");
    expect(args.targetBytes).toBe(1_048_576);
    expect(args.boundary).toBe("exact");
    expect(args.sizeMbLabel).toBe(1);
    expect(args.fromBytesFlag).toBe(false);
  });

  it("generate サブコマンドを省略可能", () => {
    expect(parseCliArgs(["generate", "-t", "pdf", "-s", "10mb"]).type).toBe(
      "pdf",
    );
    expect(parseCliArgs(["-t", "pdf", "-s", "10mb"]).targetBytes).toBe(
      10_485_760,
    );
  });

  it("境界モードを適用する", () => {
    expect(parseCliArgs(["-s", "10mb", "-b", "under"]).targetBytes).toBe(
      10_485_759,
    );
    expect(parseCliArgs(["-s", "10mb", "-b", "over"]).targetBytes).toBe(
      10_485_761,
    );
  });

  it("任意サイズ（プリセット外）を受け付ける", () => {
    expect(parseCliArgs(["-s", "2mb"]).targetBytes).toBe(2_097_152);
    expect(parseCliArgs(["-s", "512kb"]).targetBytes).toBe(524_288);
    expect(parseCliArgs(["-s", "512kb"]).sizeMbLabel).toBeNull();
  });

  it("--bytes で直接指定できる", () => {
    const args = parseCliArgs(["--bytes", "1234567", "-t", "json"]);
    expect(args.targetBytes).toBe(1_234_567);
    expect(args.fromBytesFlag).toBe(true);
  });

  it("--bytes と --size の併用を拒否する", () => {
    expect(() => parseCliArgs(["--bytes", "100", "-s", "1mb"])).toThrow(
      CliUsageError,
    );
  });

  it("上限（Web と同じ）を超えるとエラー", () => {
    expect(() =>
      parseCliArgs(["--bytes", String(MAX_TARGET_BYTES + 1)]),
    ).toThrow(CliUsageError);
    expect(() => parseCliArgs(["-s", "21mb"])).toThrow(CliUsageError);
  });

  it("上限ちょうど（20mb over）は許可", () => {
    const args = parseCliArgs(["-s", "20mb", "-b", "over"]);
    expect(args.targetBytes).toBe(MAX_TARGET_BYTES);
  });
});
