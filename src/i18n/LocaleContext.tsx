import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
import type { Locale } from "./locales";
import { getMessages, type Messages } from "./messages";

type LocaleContextValue = {
  locale: Locale;
  t: Messages;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

type LocaleProviderProps = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  children: ReactNode;
};

export function LocaleProvider({
  locale,
  setLocale,
  children,
}: LocaleProviderProps) {
  const t = useMemo(() => getMessages(locale), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t.meta.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", t.meta.description);
    }
  }, [locale, t]);

  const value = useMemo(
    () => ({ locale, t, setLocale }),
    [locale, t, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

export function useT(): Messages {
  return useLocale().t;
}
