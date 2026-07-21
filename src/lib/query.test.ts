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
    expect(paramsFromSearch("?type=pdf&size=99&boundary=nope")).toEqual(
      DEFAULT_PARAMS,
    );
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
