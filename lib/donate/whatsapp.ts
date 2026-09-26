// Plain-text pickup request for wa.me links. Short lines, no markdown, Western digits in both locales.
import { formatNumber } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import type { TKey, TVars } from "@/lib/i18n/translate";

export type TFn = (key: TKey, vars?: TVars) => string;

export type PickupMessageInput = {
  code: string;
  householdName: string;
  /** Already localized governorate name. */
  governorate: string;
  coopName: string;
  /** Already formatted, e.g. "September 2026". */
  monthLabel: string;
  lines: { name: string; qty: number; unit: string }[];
};

export function buildPickupMessage(locale: Locale, t: TFn, input: PickupMessageInput): string {
  const who = [input.householdName, input.governorate, input.coopName].filter(Boolean).join(" · ");
  const items = input.lines.map((l) =>
    t("pages.donate.whatsapp.line", { qty: formatNumber(l.qty, locale, 2), unit: l.unit, name: l.name }),
  );
  return [
    t("pages.donate.whatsapp.heading"),
    t("pages.donate.whatsapp.voucher", { code: input.code }),
    who,
    t("pages.donate.whatsapp.month", { month: input.monthLabel }),
    ...items,
    t("pages.donate.whatsapp.closing"),
    t("pages.donate.whatsapp.signature"),
  ]
    .filter(Boolean)
    .join("\n");
}

/** No phone number: WhatsApp asks the family to pick the contact themselves. */
export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
