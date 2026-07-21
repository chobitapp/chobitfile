import { describe, expect, it } from "vitest";
import { paramsFromSearch, searchFromParams, toGeneratorParams } from "./query";
import { DEFAULT_APP_PARAMS, DEFAULT_GENERATOR_PARAMS } from "./types";

describe("query", () => {
  it("reads a valid query", () => {
    expect(
      paramsFromSearch("?type=docx&size=10&boundary=under&lang=en"),
    ).toEqual({
      type: "docx",
      sizeMb: 10,
      boundary: "under",
      lang: "en",
    });
  });

  it("falls back invalid values to defaults", () => {
    expect(paramsFromSearch("?type=mp4&size=99&boundary=nope&lang=fr")).toEqual(
      DEFAULT_APP_PARAMS,
    );
  });

  it("reads additional format queries", () => {
    expect(paramsFromSearch("?type=pdf&size=5&boundary=over")).toEqual({
      type: "pdf",
      sizeMb: 5,
      boundary: "over",
      lang: "ja",
    });
    expect(paramsFromSearch("?type=json&size=1&boundary=exact")).toEqual({
      type: "json",
      sizeMb: 1,
      boundary: "exact",
      lang: "ja",
    });
  });

  it("round-trips", () => {
    const params = {
      type: "png" as const,
      sizeMb: 5 as const,
      boundary: "over" as const,
      lang: "en" as const,
    };
    expect(paramsFromSearch(searchFromParams(params))).toEqual(params);
  });

  it("toGeneratorParams drops lang", () => {
    expect(
      toGeneratorParams({
        ...DEFAULT_GENERATOR_PARAMS,
        lang: "en",
      }),
    ).toEqual(DEFAULT_GENERATOR_PARAMS);
  });
});
