import { describe, expect, it } from "vitest";
import { targetBytesFor } from "../lib/sizes";
import { generateCsv } from "./csv";
import { generateJson } from "./json";
import { generateTxt } from "./txt";

describe("generateTxt", () => {
  it.each([[1, "exact"] as const, [1, "under"] as const, [1, "over"] as const])(
    "%sMB %s で目標バイト数ちょうど",
    (sizeMb, boundary) => {
      const target = targetBytesFor(sizeMb, boundary);
      const txt = generateTxt(target);
      expect(txt.byteLength).toBe(target);
      const text = new TextDecoder().decode(txt);
      expect(text.startsWith("chobitfile dummy text\n")).toBe(true);
    },
  );
});

describe("generateCsv", () => {
  it.each([[1, "exact"] as const, [1, "under"] as const, [1, "over"] as const])(
    "%sMB %s で目標バイト数ちょうど",
    (sizeMb, boundary) => {
      const target = targetBytesFor(sizeMb, boundary);
      const csv = generateCsv(target);
      expect(csv.byteLength).toBe(target);
      const text = new TextDecoder().decode(csv);
      expect(text.startsWith("id,name,note\n")).toBe(true);
      const lines = text.trimEnd().split("\n");
      expect(lines.length).toBe(2);
      expect(lines[1].startsWith("1,chobitfile,")).toBe(true);
    },
  );
});

describe("generateJson", () => {
  it.each([[1, "exact"] as const, [1, "under"] as const, [1, "over"] as const])(
    "%sMB %s で目標バイト数ちょうど・JSON としてパース可能",
    (sizeMb, boundary) => {
      const target = targetBytesFor(sizeMb, boundary);
      const jsonBytes = generateJson(target);
      expect(jsonBytes.byteLength).toBe(target);
      const parsed = JSON.parse(new TextDecoder().decode(jsonBytes)) as {
        app: string;
        padding: string;
      };
      expect(parsed.app).toBe("chobitfile");
      expect(typeof parsed.padding).toBe("string");
    },
  );
});
