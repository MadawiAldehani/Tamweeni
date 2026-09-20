import type { Locale } from "@/lib/i18n/config";

/** Kuwait uses Western digits in both languages; "-u-nu-latn" pins that for Arabic. */
function intlLocale(locale: Locale) {
  return locale === "ar" ? "ar-KW-u-nu-latn" : "en-KW";
}

export function formatNumber(
  value: number,
  locale: Locale,
  maximumFractionDigits = 1,
): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    maximumFractionDigits,
  }).format(value);
}

/** Kuwaiti dinar has 3 decimals (1 KD = 1000 fils). */
export function formatKD(value: number, locale: Locale, fractionDigits = 3): string {
  const number = new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
  return locale === "ar" ? `${number} د.ك` : `KD ${number}`;
}

/** Whole-dinar display for big dashboard numbers: "KD 126" / "126 د.ك". */
export function formatKDWhole(value: number, locale: Locale): string {
  return formatKD(value, locale, 0);
}

/** Current month as "YYYY-MM" (the ration cycle is Gregorian). */
export function currentMonth(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Shift a "YYYY-MM" string by N months (negative for past). */
export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return currentMonth(d);
}

export function daysLeftInMonth(date: Date = new Date()): number {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return lastDay - date.getDate();
}

/** "September 2026" / "سبتمبر 2026" from "2026-09". */
export function monthLabel(month: string, locale: Locale, style: "long" | "short" = "long"): string {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat(intlLocale(locale), {
    month: style,
    year: "numeric",
  }).format(new Date(y, m - 1, 1));
}

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/** Today as "YYYY-MM-DD" in local time. */
export function todayISO(date: Date = new Date()): string {
  return `${currentMonth(date)}-${String(date.getDate()).padStart(2, "0")}`;
}
