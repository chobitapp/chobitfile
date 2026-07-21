import { createParser, parseAsStringLiteral, type UrlKeys } from "nuqs";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALES,
  type Locale,
} from "../i18n/locales";
import {
  type AppParams,
  BOUNDARY_MODES,
  type BoundaryMode,
  DEFAULT_APP_PARAMS,
  DEFAULT_GENERATOR_PARAMS,
  FILE_TYPES,
  type FileType,
  type GeneratorParams,
  SIZE_MB_OPTIONS,
  type SizeMb,
} from "./types";

function isFileType(value: string): value is FileType {
  return (FILE_TYPES as readonly string[]).includes(value);
}

function isSizeMb(value: number): value is SizeMb {
  return (SIZE_MB_OPTIONS as readonly number[]).includes(value);
}

function isBoundary(value: string): value is BoundaryMode {
  return (BOUNDARY_MODES as readonly string[]).includes(value);
}

/** size クエリ（1 / 3 / 5 / 10 / 20）を SizeMb に変換する */
const parseAsSizeMb = createParser({
  parse(value) {
    const n = Number(value);
    if (!Number.isInteger(n) || !isSizeMb(n)) return null;
    return n;
  },
  serialize(value) {
    return String(value);
  },
});

/**
 * nuqs 用のパーサ定義。
 * URL キー `size` は AppParams の `sizeMb` に、`lang` はそのままマップする。
 */
export const generatorSearchParams = {
  type: parseAsStringLiteral(FILE_TYPES)
    .withDefault(DEFAULT_GENERATOR_PARAMS.type)
    .withOptions({ clearOnDefault: false }),
  sizeMb: parseAsSizeMb
    .withDefault(DEFAULT_GENERATOR_PARAMS.sizeMb)
    .withOptions({ clearOnDefault: false }),
  boundary: parseAsStringLiteral(BOUNDARY_MODES)
    .withDefault(DEFAULT_GENERATOR_PARAMS.boundary)
    .withOptions({ clearOnDefault: false }),
  lang: parseAsStringLiteral(LOCALES)
    .withDefault(DEFAULT_LOCALE)
    .withOptions({ clearOnDefault: false }),
};

export const generatorUrlKeys = {
  sizeMb: "size",
} as const satisfies UrlKeys<typeof generatorSearchParams>;

/** URL クエリから設定を読む。不正値はデフォルトにフォールバック */
export function paramsFromSearch(search: string): AppParams {
  const q = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const typeRaw = q.get("type") ?? "";
  const sizeRaw = Number(q.get("size"));
  const boundaryRaw = q.get("boundary") ?? "";
  const langRaw = q.get("lang") ?? "";

  return {
    type: isFileType(typeRaw) ? typeRaw : DEFAULT_APP_PARAMS.type,
    sizeMb: isSizeMb(sizeRaw) ? sizeRaw : DEFAULT_APP_PARAMS.sizeMb,
    boundary: isBoundary(boundaryRaw)
      ? boundaryRaw
      : DEFAULT_APP_PARAMS.boundary,
    lang: isLocale(langRaw) ? langRaw : DEFAULT_APP_PARAMS.lang,
  };
}

export function searchFromParams(params: AppParams): string {
  const q = new URLSearchParams({
    type: params.type,
    size: String(params.sizeMb),
    boundary: params.boundary,
    lang: params.lang,
  });
  return `?${q.toString()}`;
}

/** 生成 API に渡す部分だけ取り出す */
export function toGeneratorParams(params: AppParams): GeneratorParams {
  return {
    type: params.type,
    sizeMb: params.sizeMb,
    boundary: params.boundary,
  };
}

export type { AppParams, Locale };
