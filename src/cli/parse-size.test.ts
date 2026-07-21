import { describe, expect, it } from "vitest";
import { parseSizeToBytes, tryParseWholeMibLabel } from "./parse-size";

describe("parseSizeToBytes", () => {
  it("生のバイト数を受け付ける", () => {
    expect(parseSizeToBytes("12345")).toBe(12345);
    expect(parseSizeToBytes(" 1048576 ")).toBe(1_048_576);
  });

  it("kb / mb を 1024 系で解釈する", () => {
    expect(parseSizeToBytes("512kb")).toBe(512 * 1024);
    expect(parseSizeToBytes("512k")).toBe(512 * 1024);
    expect(parseSizeToBytes("10mb")).toBe(10 * 1024 * 1024);
    expect(parseSizeToBytes("10m")).toBe(10 * 1024 * 1024);
    expect(parseSizeToBytes("1MB")).toBe(1 * 1024 * 1024);
  });

  it("不正な表記を拒否する", () => {
    expect(() => parseSizeToBytes("")).toThrow();
    expect(() => parseSizeToBytes("10.5mb")).toThrow();
    expect(() => parseSizeToBytes("10gb")).toThrow();
    expect(() => parseSizeToBytes("abc")).toThrow();
    expect(() => parseSizeToBytes("0")).toThrow();
    expect(() => parseSizeToBytes("-1mb")).toThrow();
  });
});

describe("tryParseWholeMibLabel", () => {
  it("整数 MiB ラベルだけ返す", () => {
    expect(tryParseWholeMibLabel("10mb")).toBe(10);
    expect(tryParseWholeMibLabel("2m")).toBe(2);
    expect(tryParseWholeMibLabel("512kb")).toBeNull();
    expect(tryParseWholeMibLabel("1048576")).toBeNull();
  });
});
