export const LOCALES = ["ja", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ja";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** BCP 47 タグ → アプリロケール。未知は DEFAULT_LOCALE */
export function localeFromTag(tag: string): Locale {
  const primary = tag.split("-")[0]?.toLowerCase() ?? "";
  return primary === "en" ? "en" : DEFAULT_LOCALE;
}

export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  return localeFromTag(navigator.language);
}

export function intlLocale(locale: Locale): string {
  return locale === "ja" ? "ja-JP" : "en-US";
}
