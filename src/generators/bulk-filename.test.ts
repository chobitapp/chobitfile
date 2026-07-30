import { describe, expect, it } from "vitest";
import { buildBulkBaseName, sampleRandomSlug } from "./bulk-filename";

function makeSequenceRandom(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length];
    i += 1;
    return v;
  };
}

describe("buildBulkBaseName", () => {
  it("sequential はゼロ埋め連番", () => {
    const used = new Set<string>();
    expect(
      buildBulkBaseName({
        mode: "sequential",
        sequentialWidth: 3,
        index: 7,
        usedBaseNames: used,
        random: () => 0,
      }),
    ).toBe("chobitfile-007");
    expect(used.has("chobitfile-007")).toBe(true);
  });

  it("random en は adj-animal 形式", () => {
    const used = new Set<string>();
    const base = buildBulkBaseName({
      mode: "random",
      locale: "en",
      sequentialWidth: 1,
      index: 1,
      usedBaseNames: used,
      random: makeSequenceRandom([0.0, 0.0]),
    });
    expect(base).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
    expect(used.has(base)).toBe(true);
  });

  it("random ja はひらがなの単語組み合わせ", () => {
    const used = new Set<string>();
    const base = buildBulkBaseName({
      mode: "random",
      locale: "ja",
      sequentialWidth: 1,
      index: 1,
      usedBaseNames: used,
      random: makeSequenceRandom([0.0, 0.0]),
    });
    expect(base).toMatch(/^[\u3040-\u309f]+-[\u3040-\u309f]+$/);
  });

  it("衝突時は再試行して別名を返す", () => {
    const used = new Set<string>(["able-aardvark"]);
    // 最初の2呼び出しが 0,0 → able-aardvark（衝突）、次が 0.5,0.5 → 別語
    const random = makeSequenceRandom([0.0, 0.0, 0.5, 0.5]);
    const base = buildBulkBaseName({
      mode: "random",
      locale: "en",
      sequentialWidth: 1,
      index: 1,
      usedBaseNames: used,
      random,
    });
    expect(base).not.toBe("able-aardvark");
    expect(base).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
  });
});

describe("sampleRandomSlug", () => {
  it("en / ja それぞれ形式が異なる", () => {
    const en = sampleRandomSlug("en", makeSequenceRandom([0.1, 0.2]));
    const ja = sampleRandomSlug("ja", makeSequenceRandom([0.1, 0.2]));
    expect(en).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
    expect(ja).toMatch(/^[\u3040-\u309f]+-[\u3040-\u309f]+$/);
  });
});
