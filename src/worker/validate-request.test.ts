import { describe, expect, it } from "vitest";
import { MAX_TARGET_BYTES } from "../lib/sizes";
import { parseGenerateRequest } from "./validate-request";

const validBase = {
  type: "png",
  targetBytes: 1_048_576,
  filename: "chobitfile-1mb-exact.png",
};

describe("parseGenerateRequest", () => {
  it("正当なリクエストを通す", () => {
    expect(parseGenerateRequest(validBase)).toEqual(validBase);
  });

  it("imageLabel 付き PNG を通す", () => {
    const req = {
      ...validBase,
      imageLabel: {
        sizeMb: 1,
        boundary: "exact",
        targetBytes: 1_048_576,
      },
    };
    expect(parseGenerateRequest(req)).toEqual(req);
  });

  it("type が不正なら拒否する", () => {
    expect(() => parseGenerateRequest({ ...validBase, type: "mp4" })).toThrow(
      /不正な形式/,
    );
  });

  it("targetBytes が過大なら拒否する", () => {
    expect(() =>
      parseGenerateRequest({
        ...validBase,
        targetBytes: MAX_TARGET_BYTES + 1,
      }),
    ).toThrow(/不正な目標サイズ/);
  });

  it("targetBytes が非整数なら拒否する", () => {
    expect(() =>
      parseGenerateRequest({ ...validBase, targetBytes: 1.5 }),
    ).toThrow(/不正な目標サイズ/);
  });

  it("filename が想定外なら拒否する", () => {
    expect(() =>
      parseGenerateRequest({
        ...validBase,
        filename: "../evil.png",
      }),
    ).toThrow(/不正なファイル名/);
    expect(() =>
      parseGenerateRequest({
        ...validBase,
        filename: "chobitfile-99mb-exact.png",
      }),
    ).toThrow(/不正なファイル名/);
  });

  it("非オブジェクトを拒否する", () => {
    expect(() => parseGenerateRequest(null)).toThrow(/オブジェクト/);
    expect(() => parseGenerateRequest("png")).toThrow(/オブジェクト/);
  });

  it("imageLabel を PDF に付けたら拒否する", () => {
    expect(() =>
      parseGenerateRequest({
        type: "pdf",
        targetBytes: 1_048_576,
        filename: "chobitfile-1mb-exact.pdf",
        imageLabel: {
          sizeMb: 1,
          boundary: "exact",
          targetBytes: 1_048_576,
        },
      }),
    ).toThrow(/imageLabel/);
  });
});
