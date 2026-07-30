import { describe, expect, it } from "vitest";
import { BULK_TARGET_BYTES, generateBulkZip, planBulkFiles } from "./bulk";
import { generateFile } from "./generate-file";
import { isZipLocalHeader } from "./ooxml";

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
});

describe("generateBulkZip", () => {
  it("ZIP に計画どおりのエントリを詰める", async () => {
    const zip = await generateBulkZip({ count: 4, types: ["txt", "json"] });
    expect(isZipLocalHeader(zip)).toBe(true);

    // store ZIP のローカルヘッダ名を拾ってエントリ名を確認
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
    expect(names).toEqual([
      "chobitfile-1.txt",
      "chobitfile-2.json",
      "chobitfile-3.txt",
      "chobitfile-4.json",
    ]);
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
