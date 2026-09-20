"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  dirFor,
  isLocale,
  type Locale,
} from "./config";
import { translate, type TKey, type TVars } from "./translate";

export { localized, translate } from "./translate";
export type { TKey, TVars } from "./translate";

type LanguageContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  isRtl: boolean;
  setLocale: (locale: Locale) => void;
  t: (key: TKey, vars?: TVars) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function persistLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* private mode or blocked storage: the cookie still works */
  }
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${oneYear}; SameSite=Lax`;
}

function applyToDocument(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = dirFor(locale);
}

export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // The cookie drives SSR; localStorage restores the choice if the cookie was cleared.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (isLocale(stored) && stored !== initialLocale) {
      setLocaleState(stored);
      persistLocale(stored);
      applyToDocument(stored);
    }
  }, [initialLocale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
    applyToDocument(next);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      dir: dirFor(locale),
      isRtl: locale === "ar",
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
    }),
    [locale, setLocale],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}

/** Shorthand: `const t = useT(); t("nav.home")`. */
export function useT() {
  return useLanguage().t;
}
