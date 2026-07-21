import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_LOCALE, detectBrowserLocale, localeFromTag } from "./locales";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("localeFromTag", () => {
  it("maps en / ja variants", () => {
    expect(localeFromTag("en")).toBe("en");
    expect(localeFromTag("en-US")).toBe("en");
    expect(localeFromTag("ja")).toBe("ja");
    expect(localeFromTag("ja-JP")).toBe("ja");
  });

  it("returns null for unsupported languages", () => {
    expect(localeFromTag("fr")).toBeNull();
    expect(localeFromTag("zh-CN")).toBeNull();
    expect(localeFromTag("")).toBeNull();
  });
});

describe("detectBrowserLocale", () => {
  it("prefers the first supported language in navigator.languages", () => {
    vi.stubGlobal("navigator", {
      language: "fr-FR",
      languages: ["fr-FR", "en-GB", "ja"],
    });
    expect(detectBrowserLocale()).toBe("en");
  });

  it("uses navigator.language when languages is empty", () => {
    vi.stubGlobal("navigator", {
      language: "en-US",
      languages: [],
    });
    expect(detectBrowserLocale()).toBe("en");
  });

  it("falls back to DEFAULT_LOCALE when nothing matches", () => {
    vi.stubGlobal("navigator", {
      language: "de-DE",
      languages: ["de-DE", "fr-FR"],
    });
    expect(detectBrowserLocale()).toBe(DEFAULT_LOCALE);
  });
});
