import { afterEach, describe, expect, it, vi } from "vitest";
import { detectBrowserLocale } from "../i18n/locales";
import { paramsFromSearch, searchFromParams, toGeneratorParams } from "./query";
import { DEFAULT_GENERATOR_PARAMS } from "./types";

afterEach(() => {
  vi.unstubAllGlobals();
});

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

  it("falls back invalid values; lang uses browser locale", () => {
    vi.stubGlobal("navigator", {
      language: "en-US",
      languages: ["en-US"],
    });
    expect(paramsFromSearch("?type=mp4&size=99&boundary=nope&lang=fr")).toEqual(
      {
        ...DEFAULT_GENERATOR_PARAMS,
        lang: "en",
      },
    );
  });

  it("omitted lang follows browser locale", () => {
    vi.stubGlobal("navigator", {
      language: "en-GB",
      languages: ["en-GB"],
    });
    expect(paramsFromSearch("?type=pdf&size=5&boundary=over")).toEqual({
      type: "pdf",
      sizeMb: 5,
      boundary: "over",
      lang: "en",
    });

    vi.stubGlobal("navigator", {
      language: "ja-JP",
      languages: ["ja-JP"],
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

  it("detectBrowserLocale is used when lang is missing", () => {
    vi.stubGlobal("navigator", {
      language: "en",
      languages: ["en"],
    });
    expect(paramsFromSearch("").lang).toBe(detectBrowserLocale());
    expect(paramsFromSearch("").lang).toBe("en");
  });
});
