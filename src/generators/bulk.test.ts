import { describe, expect, it } from "vitest";
import { BULK_DIR_MAX_DEPTH } from "../lib/types";
import {
  BULK_TARGET_BYTES,
  generateBulkZip,
  planBulkFiles,
  randomDirPrefix,
} from "./bulk";
import { generateFile } from "./generate-file";
import { isZipLocalHeader } from "./ooxml";

/** 決定的な疑似乱数（テスト用） */
function makeSequenceRandom(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length];
    i += 1;
    return v;
  };
}

function zipEntryNames(zip: Uint8Array): string[] {
  const names: string[] = [];
  let offset = 0;
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  while (offset + 30 <= zip.byteLength) {
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) break;
    const nameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    const size = view.getUint32(offset + 18, true);
    const nameBytes = zip.subarray(offset + 30, offset + 30 + nameLen);
    names.push(new TextDecoder().decode(nameBytes));
    offset += 30 + nameLen + extraLen + size;
  }
  return names;
}

describe("planBulkFiles", () => {
  it("ラウンドロビンで形式を割り当てる", () => {
    const plans = planBulkFiles({ count: 5, types: ["png", "pdf", "txt"] });
    expect(plans.map((p) => p.type)).toEqual([
      "png",
      "pdf",
      "txt",
      "png",
      "pdf",
    ]);
    expect(plans.map((p) => p.name)).toEqual([
      "chobitfile-1.png",
      "chobitfile-2.pdf",
      "chobitfile-3.txt",
      "chobitfile-4.png",
      "chobitfile-5.pdf",
    ]);
  });

  it("件数が増えるとゼロ埋め幅が広がる", () => {
    const plans = planBulkFiles({ count: 12, types: ["txt"] });
    expect(plans[0].name).toBe("chobitfile-01.txt");
    expect(plans[11].name).toBe("chobitfile-12.txt");
  });

  it("重複形式は取り除く", () => {
    const plans = planBulkFiles({
      count: 3,
      types: ["png", "png", "pdf"],
    });
    expect(plans.map((p) => p.type)).toEqual(["png", "pdf", "png"]);
  });

  it("件数0・形式なしはエラー", () => {
    expect(() => planBulkFiles({ count: 0, types: ["txt"] })).toThrow(
      /Invalid bulk count/,
    );
    expect(() => planBulkFiles({ count: 1, types: [] })).toThrow(
      /At least one file type/,
    );
  });

  it("directories オフ時はフラット配置", () => {
    const plans = planBulkFiles({
      count: 3,
      types: ["txt"],
      directories: false,
    });
    for (const plan of plans) {
      expect(plan.name).not.toContain("/");
    }
  });

  it("directories オン時は最大2階層のパスになる", () => {
    // depth 選択と dir 選択が順に読まれる
    // depth: 0.0 → 1, 0.99 → 2 / その後 dir 選択
    // count=3 → poolSize=8 → dir-1..dir-8
    const random = makeSequenceRandom([
      0.0,
      0.1, // depth1, dir → dir-1
      0.99,
      0.2,
      0.8, // depth2, dir, dir → dir-2/dir-7
      0.4,
      0.5, // depth1, dir → dir-5
    ]);
    const plans = planBulkFiles({
      count: 3,
      types: ["txt"],
      directories: true,
      random,
    });

    for (const plan of plans) {
      expect(plan.name).toMatch(/^dir-\d+(?:\/dir-\d+)?\/chobitfile-\d+\.txt$/);
      const depth = plan.name.split("/").length - 1;
      expect(depth).toBeGreaterThanOrEqual(1);
      expect(depth).toBeLessThanOrEqual(BULK_DIR_MAX_DEPTH);
    }

    expect(plans[0].name).toBe("dir-1/chobitfile-1.txt");
    expect(plans[1].name).toBe("dir-2/dir-7/chobitfile-2.txt");
    expect(plans[2].name).toBe("dir-5/chobitfile-3.txt");
  });
});

describe("randomDirPrefix", () => {
  it("深さ1の接頭辞を返す", () => {
    const prefix = randomDirPrefix(
      ["dir-01", "dir-02"],
      2,
      makeSequenceRandom([0.0, 0.0]),
    );
    expect(prefix).toBe("dir-01/");
  });

  it("深さ2の接頭辞を返す", () => {
    const prefix = randomDirPrefix(
      ["dir-01", "dir-02"],
      2,
      makeSequenceRandom([0.99, 0.0, 0.99]),
    );
    expect(prefix).toBe("dir-01/dir-02/");
  });
});

describe("generateBulkZip", () => {
  it("ZIP に計画どおりのエントリを詰める", async () => {
    const zip = await generateBulkZip({ count: 4, types: ["txt", "json"] });
    expect(isZipLocalHeader(zip)).toBe(true);
    expect(zipEntryNames(zip)).toEqual([
      "chobitfile-1.txt",
      "chobitfile-2.json",
      "chobitfile-3.txt",
      "chobitfile-4.json",
    ]);
  });

  it("directories オン時は ZIP エントリにパスが付く", async () => {
    const random = makeSequenceRandom([0.0, 0.0, 0.99, 0.1, 0.9]);
    const zip = await generateBulkZip({
      count: 2,
      types: ["txt"],
      directories: true,
      random,
    });
    expect(isZipLocalHeader(zip)).toBe(true);
    const names = zipEntryNames(zip);
    expect(names).toHaveLength(2);
    for (const name of names) {
      expect(name).toContain("/");
      const depth = name.split("/").length - 1;
      expect(depth).toBeLessThanOrEqual(BULK_DIR_MAX_DEPTH);
    }
  });

  it("各形式の bulk 目標サイズでサンプル生成できる", async () => {
    for (const [type, targetBytes] of Object.entries(BULK_TARGET_BYTES)) {
      const bytes = await generateFile(
        type as keyof typeof BULK_TARGET_BYTES,
        targetBytes,
      );
      expect(bytes.byteLength).toBe(targetBytes);
    }
  });
});
