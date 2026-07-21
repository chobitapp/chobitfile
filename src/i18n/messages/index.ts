import type { Locale } from "../locales";
import { en } from "./en";
import { ja, type Messages } from "./ja";

const catalogs: Record<Locale, Messages> = {
  ja,
  en,
};

export function getMessages(locale: Locale): Messages {
  return catalogs[locale];
}

export type { Messages };
