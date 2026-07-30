import { describe, expect, it } from "vitest";
import { MAX_TARGET_BYTES } from "../lib/sizes";
import {
  parseBulkGenerateRequest,
  parseGenerateRequest,
  parseWorkerRequest,
} from "./validate-request";

const validBase = {
  type: "png",
  targetBytes: 1_048_576,
  filename: "chobitfile-1mb-exact.png",
};

describe("parseGenerateRequest", () => {
  it("accepts a valid request", () => {
    expect(parseGenerateRequest(validBase)).toEqual({
      ...validBase,
      mode: "single",
    });
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
      mode: "single",
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
    expect(parseGenerateRequest(req)).toEqual({
      ...req,
      mode: "single",
    });
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

describe("parseBulkGenerateRequest", () => {
  const validBulk = {
    mode: "bulk" as const,
    count: 100,
    types: ["png", "pdf"] as const,
    filename: "chobitfile-bulk-100.zip",
  };

  it("accepts a valid bulk request", () => {
    expect(parseBulkGenerateRequest(validBulk)).toEqual({
      mode: "bulk",
      count: 100,
      types: ["png", "pdf"],
      filename: "chobitfile-bulk-100.zip",
      directories: false,
      nameMode: "sequential",
      nameLocale: "en",
    });
  });

  it("accepts directories flag", () => {
    expect(
      parseBulkGenerateRequest({
        ...validBulk,
        directories: true,
      }),
    ).toEqual({
      mode: "bulk",
      count: 100,
      types: ["png", "pdf"],
      filename: "chobitfile-bulk-100.zip",
      directories: true,
      nameMode: "sequential",
      nameLocale: "en",
    });
  });

  it("accepts nameMode and nameLocale", () => {
    expect(
      parseBulkGenerateRequest({
        ...validBulk,
        nameMode: "random",
        nameLocale: "ja",
      }),
    ).toEqual({
      mode: "bulk",
      count: 100,
      types: ["png", "pdf"],
      filename: "chobitfile-bulk-100.zip",
      directories: false,
      nameMode: "random",
      nameLocale: "ja",
    });
  });

  it("rejects invalid nameMode / nameLocale", () => {
    expect(() =>
      parseBulkGenerateRequest({
        ...validBulk,
        nameMode: "uuid",
      }),
    ).toThrow(/Invalid bulk nameMode/);
    expect(() =>
      parseBulkGenerateRequest({
        ...validBulk,
        nameLocale: "fr",
      }),
    ).toThrow(/Invalid bulk nameLocale/);
  });

  it("rejects non-boolean directories", () => {
    expect(() =>
      parseBulkGenerateRequest({
        ...validBulk,
        directories: "yes",
      }),
    ).toThrow(/Invalid bulk directories/);
  });

  it("dedupes types", () => {
    expect(
      parseBulkGenerateRequest({
        ...validBulk,
        types: ["png", "png", "txt"],
      }),
    ).toEqual({
      mode: "bulk",
      count: 100,
      types: ["png", "txt"],
      filename: "chobitfile-bulk-100.zip",
      directories: false,
      nameMode: "sequential",
      nameLocale: "en",
    });
  });

  it("rejects empty types", () => {
    expect(() => parseBulkGenerateRequest({ ...validBulk, types: [] })).toThrow(
      /non-empty/,
    );
  });

  it("rejects invalid count", () => {
    expect(() => parseBulkGenerateRequest({ ...validBulk, count: 0 })).toThrow(
      /Invalid bulk count/,
    );
    expect(() =>
      parseBulkGenerateRequest({ ...validBulk, count: 10001 }),
    ).toThrow(/Invalid bulk count/);
  });

  it("rejects bad zip filename", () => {
    expect(() =>
      parseBulkGenerateRequest({
        ...validBulk,
        filename: "evil.zip",
      }),
    ).toThrow(/Invalid bulk filename/);
  });
});

describe("parseWorkerRequest", () => {
  it("routes bulk and single", () => {
    expect(
      parseWorkerRequest({
        mode: "bulk",
        count: 2,
        types: ["txt"],
        filename: "chobitfile-bulk-2.zip",
      }).mode,
    ).toBe("bulk");
    expect(parseWorkerRequest(validBase).mode).toBe("single");
  });
});
