// Plain-text version of the checklist for navigator.share / the clipboard.
import type { Locale } from "@/lib/i18n/config";
import type { TKey, TVars } from "@/lib/i18n/translate";
import { formatKD, monthLabel } from "@/lib/format";

export type ShareLine = {
  /** Localized item name. */
  name: string;
  /** "20 kg", already formatted. */
  qty: string;
  /** "4 × 5 kg" or "" when no hint applies. */
  pack: string;
};

export type ShareInput = {
  household: string;
  coop: string;
  month: string;
  lines: ShareLine[];
  planKD: number;
};

type Translate = (key: TKey, vars?: TVars) => string;

export function buildShareText(locale: Locale, t: Translate, input: ShareInput): string {
  const appName = locale === "ar" ? t("app.nameArabic") : t("app.name");
  const head = [`${appName} — ${t("pages.plan.checklist.title")}`, [input.household, input.coop].filter(Boolean).join(" · "), monthLabel(input.month, locale)];
  const body = input.lines.map((l) => `• ${l.name} — ${l.qty}${l.pack ? ` (${l.pack})` : ""}`);
  const foot = [
    t("pages.plan.checklist.totals", { count: input.lines.length, kd: formatKD(input.planKD, locale) }),
    t("pages.plan.checklist.showAtBranch"),
    t("pages.plan.checklist.madeWith"),
  ];
  return [...head.filter(Boolean), "", ...body, "", ...foot].join("\n");
}
