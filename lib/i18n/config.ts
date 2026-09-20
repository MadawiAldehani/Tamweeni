export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Cookie read on the server so the first paint already has the right `dir`. */
export const LOCALE_COOKIE = "tamweeni-locale";
/** localStorage backup so the choice survives cleared cookies. */
export const LOCALE_STORAGE_KEY = "tamweeni.locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function dirFor(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}
