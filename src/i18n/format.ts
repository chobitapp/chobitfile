import { baseBytesForMb } from "../lib/sizes";
import type { SizeMb } from "../lib/types";
import { intlLocale, type Locale } from "./locales";
import { getMessages } from "./messages";

export function formatBytes(bytes: number, locale: Locale): string {
  return bytes.toLocaleString(intlLocale(locale));
}

export function sizeOptionLabel(sizeMb: SizeMb, locale: Locale): string {
  const t = getMessages(locale);
  return t.sizeOption(sizeMb, formatBytes(baseBytesForMb(sizeMb), locale));
}
