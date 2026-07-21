import { describe, expect, it } from "vitest";
import { MAX_TARGET_BYTES } from "../lib/sizes";
import { parseGenerateRequest } from "./validate-request";

const validBase = {
  type: "png",
  targetBytes: 1_048_576,
  filename: "chobitfile-1mb-exact.png",
};

describe("parseGenerateRequest", () => {
  it("accepts a valid request", () => {
    expect(parseGenerateRequest(validBase)).toEqual(validBase);
  });

  it("accepts PNG with imageLabel and defaults locale to ja", () => {
    const req = {
      ...validBase,
      imageLabel: {
        sizeMb: 1 as const,
        boundary: "exact" as const,
        targetBytes: 1_048_576,
      },
    };
    expect(parseGenerateRequest(req)).toEqual({
      ...req,
      imageLabel: { ...req.imageLabel, locale: "ja" },
    });
  });

  it("accepts imageLabel.locale", () => {
    const req = {
      ...validBase,
      imageLabel: {
        sizeMb: 1 as const,
        boundary: "exact" as const,
        targetBytes: 1_048_576,
        locale: "en" as const,
      },
    };
    expect(parseGenerateRequest(req)).toEqual(req);
  });

  it("rejects invalid type", () => {
    expect(() => parseGenerateRequest({ ...validBase, type: "mp4" })).toThrow(
      /Invalid type/,
    );
  });

  it("rejects oversized targetBytes", () => {
    expect(() =>
      parseGenerateRequest({
        ...validBase,
        targetBytes: MAX_TARGET_BYTES + 1,
      }),
    ).toThrow(/Invalid target size/);
  });

  it("rejects non-integer targetBytes", () => {
    expect(() =>
      parseGenerateRequest({ ...validBase, targetBytes: 1.5 }),
    ).toThrow(/Invalid target size/);
  });

  it("rejects unexpected filename", () => {
    expect(() =>
      parseGenerateRequest({
        ...validBase,
        filename: "../evil.png",
      }),
    ).toThrow(/Invalid filename/);
    expect(() =>
      parseGenerateRequest({
        ...validBase,
        filename: "chobitfile-99mb-exact.png",
      }),
    ).toThrow(/Invalid filename/);
  });

  it("rejects non-objects", () => {
    expect(() => parseGenerateRequest(null)).toThrow(/object/);
    expect(() => parseGenerateRequest("png")).toThrow(/object/);
  });

  it("rejects imageLabel on PDF", () => {
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
