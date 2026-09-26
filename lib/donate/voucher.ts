// Pure helpers over Donation rows that share a voucher code. No React: safe for server code.
import type { Donation, DonationStatus } from "@/lib/data/types";
import type { Locale } from "@/lib/i18n/config";
import { localized, type TKey } from "@/lib/i18n/translate";
import { unitFor } from "@/lib/plan/units";
import { getItem, type RationItemId } from "@/lib/ration/catalog";
import { sadaqaTotals } from "@/lib/ration/meals";

export type VoucherGroup = {
  code: string;
  donations: Donation[];
  /** "collected" only when every line of the pledge is collected. */
  status: DonationStatus;
  created_at: string;
  month: string;
};

export type VoucherTotals = { kg: number; kd: number; meals: number };

export type VoucherLine = {
  /** Localized item name. */
  name: string;
  qty: number;
  /** Translated unit label, already pluralised for cans. */
  unit: string;
};

/** One entry per voucher code, newest pledge first. */
export function groupByVoucher(donations: Donation[]): VoucherGroup[] {
  const groups = new Map<string, Donation[]>();
  for (const donation of donations) {
    const list = groups.get(donation.voucher_code) ?? [];
    list.push(donation);
    groups.set(donation.voucher_code, list);
  }
  return Array.from(groups, ([code, rows]): VoucherGroup => ({
    code,
    donations: rows,
    status: rows.every((d) => d.status === "collected") ? "collected" : "pledged",
    created_at: rows.reduce((min, d) => (d.created_at < min ? d.created_at : min), rows[0].created_at),
    month: rows[0].month,
  })).sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
}

export function voucherTotals(donations: Donation[]): VoucherTotals {
  const { kg, kd, meals } = sadaqaTotals(donations);
  return { kg, kd, meals };
}

/** Item lines in catalog order; duplicate rows for one item are merged. */
export function voucherLines(
  donations: Donation[],
  locale: Locale,
  t: (key: TKey) => string,
): VoucherLine[] {
  const qtyByItem = new Map<RationItemId, number>();
  for (const donation of donations) {
    if (donation.qty <= 0) continue;
    qtyByItem.set(donation.item_id, (qtyByItem.get(donation.item_id) ?? 0) + donation.qty);
  }
  return Array.from(qtyByItem, ([itemId, qty]) => {
    const item = getItem(itemId);
    return { name: localized(item, "name", locale), qty, unit: unitFor(item.unit, qty, t) };
  });
}
