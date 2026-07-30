import { adjectives, animals } from "unique-names-generator";
import type { BulkNameLocale, BulkNameMode } from "../lib/types";
import { JA_ADJECTIVES, JA_NOUNS } from "./ja-words";

const SLUG_SEPARATOR = "-";
/** 衝突時の再試行上限。超えたら index を付与して確定する */
const MAX_RANDOM_ATTEMPTS = 32;

export type BulkFilenameOptions = {
  mode: BulkNameMode;
  /** mode が random のとき使用。省略時 en */
  locale?: BulkNameLocale;
  /** 連番のゼロ埋め幅（sequential 用） */
  sequentialWidth: number;
  /** 1-based index */
  index: number;
  /** すでに使ったベース名（拡張子なし）。衝突回避用 */
  usedBaseNames: Set<string>;
  random: () => number;
};

function pickFrom(list: readonly string[], random: () => number): string {
  if (list.length === 0) {
    throw new Error("Word list is empty");
  }
  const i = Math.min(list.length - 1, Math.floor(random() * list.length));
  return list[i];
}

/** 英語辞書語をファイル名セーフな断片にする */
function sanitizeEnglishPart(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 32);
}

function randomEnglishSlug(random: () => number): string {
  const left = sanitizeEnglishPart(pickFrom(adjectives, random));
  const right = sanitizeEnglishPart(pickFrom(animals, random));
  if (!left || !right) {
    return `file${String(Math.floor(random() * 1e9))}`;
  }
  return `${left}${SLUG_SEPARATOR}${right}`;
}

function randomJapaneseSlug(random: () => number): string {
  const left = pickFrom(JA_ADJECTIVES, random);
  const right = pickFrom(JA_NOUNS, random);
  return `${left}${SLUG_SEPARATOR}${right}`;
}

function randomSlug(locale: BulkNameLocale, random: () => number): string {
  return locale === "ja"
    ? randomJapaneseSlug(random)
    : randomEnglishSlug(random);
}

/**
 * Bulk 1 件分のベース名（拡張子なし）を返す。
 * sequential: `chobitfile-0001`
 * random: `brave-fox` / `あかい-ねこ`（衝突時は再試行、だめなら index 付与）
 */
export function buildBulkBaseName(options: BulkFilenameOptions): string {
  const {
    mode,
    locale = "en",
    sequentialWidth,
    index,
    usedBaseNames,
    random,
  } = options;

  if (mode === "sequential") {
    const base = `chobitfile-${String(index).padStart(sequentialWidth, "0")}`;
    usedBaseNames.add(base);
    return base;
  }

  for (let attempt = 0; attempt < MAX_RANDOM_ATTEMPTS; attempt++) {
    const base = randomSlug(locale, random);
    if (!usedBaseNames.has(base)) {
      usedBaseNames.add(base);
      return base;
    }
  }

  // 衝突が続く場合は index を付けて一意化
  for (let n = index; ; n++) {
    const base = `${randomSlug(locale, random)}${SLUG_SEPARATOR}${n}`;
    if (!usedBaseNames.has(base)) {
      usedBaseNames.add(base);
      return base;
    }
  }
}

/** テスト・プレビュー用に 1 件だけランダム slug を生成 */
export function sampleRandomSlug(
  locale: BulkNameLocale,
  random: () => number = Math.random,
): string {
  return randomSlug(locale, random);
}
