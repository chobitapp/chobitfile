import { describe, expect, it } from "vitest";
import { paramsFromSearch, searchFromParams } from "./query";
import { DEFAULT_PARAMS } from "./types";

describe("query", () => {
  it("正しいクエリを読む", () => {
    expect(paramsFromSearch("?type=docx&size=10&boundary=under")).toEqual({
      type: "docx",
      sizeMb: 10,
      boundary: "under",
    });
  });

  it("不正値はデフォルトへフォールバック", () => {
    expect(paramsFromSearch("?type=mp4&size=99&boundary=nope")).toEqual(
      DEFAULT_PARAMS,
    );
  });

  it("追加形式のクエリを読む", () => {
    expect(paramsFromSearch("?type=pdf&size=5&boundary=over")).toEqual({
      type: "pdf",
      sizeMb: 5,
      boundary: "over",
    });
    expect(paramsFromSearch("?type=json&size=1&boundary=exact")).toEqual({
      type: "json",
      sizeMb: 1,
      boundary: "exact",
    });
  });

  it("往復できる", () => {
    const params = {
      type: "png" as const,
      sizeMb: 5 as const,
      boundary: "over" as const,
    };
    expect(paramsFromSearch(searchFromParams(params))).toEqual(params);
  });
});
