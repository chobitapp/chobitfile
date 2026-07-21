export const LOCALES = ["ja", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** ブラウザ設定が取れない / 非対応言語のときのフォールバック */
export const DEFAULT_LOCALE: Locale = "ja";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** BCP 47 タグ → アプリロケール。対応外は null */
export function localeFromTag(tag: string): Locale | null {
  const primary = tag.split("-")[0]?.toLowerCase() ?? "";
  if (primary === "en" || primary === "ja") return primary;
  return null;
}

/**
 * ブラウザの言語設定からロケールを決める。
 * `navigator.languages` を優先順に見て、最初に対応している言語を採用。
 * 取れない場合は DEFAULT_LOCALE。
 */
export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;

  const tags: string[] = [
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
    navigator.language,
  ];

  for (const tag of tags) {
    if (!tag) continue;
    const locale = localeFromTag(tag);
    if (locale) return locale;
  }

  return DEFAULT_LOCALE;
}

export function intlLocale(locale: Locale): string {
  return locale === "ja" ? "ja-JP" : "en-US";
}
