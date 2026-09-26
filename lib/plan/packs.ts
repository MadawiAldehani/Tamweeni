// Typical pack sizes at the co-op ration branch, in catalog units (kg / litre / can).
// They only turn a planned quantity into a "4 × 5 kg" hint on the checklist; the plan
// itself stays in catalog units. Adjust here if a branch stocks different packs.
import type { TKey, TVars } from "@/lib/i18n/translate";
import type { RationItem, RationItemId } from "@/lib/ration/catalog";

export const PACK_SIZE: Record<RationItemId, number> = {
  rice: 5, // 5 kg bag
  sugar: 1, // 1 kg bag
  oil: 3, // 3 L bottle
  milk_powder: 2.27, // 2.27 kg tin
  milk_longlife: 1, // 1 L carton
  tomato_paste: 1, // one can
  lentils: 0.3, // 300 g bag
  chicken: 1, // 1 kg bird
  dates: 0.5, // 500 g box
  infant_milk: 1, // one can
  infant_food: 1, // one can
};

export type PackHint = { packs: number; packSize: number };

/** Whole packs needed to cover `qty`; zero when nothing is planned. */
export function packsFor(item: RationItem, qty: number): PackHint {
  const packSize = PACK_SIZE[item.id];
  return { packs: qty > 0 ? Math.ceil(qty / packSize - 1e-9) : 0, packSize };
}

type Translate = (key: TKey, vars?: TVars) => string;

/** "4 × 5 kg", "7 × 300 g" or "28 cans" — already translated; "" when nothing is planned. */
export function packLabel(item: RationItem, qty: number, t: Translate): string {
  const { packs, packSize } = packsFor(item, qty);
  if (packs === 0) return "";
  if (item.unit === "can") return t(packs === 1 ? "pages.plan.pack.can" : "pages.plan.pack.cans", { packs });
  const grams = item.unit === "kg" && packSize < 1;
  const size = grams ? Math.round(packSize * 1000) : packSize;
  const unit = grams ? t("pages.plan.pack.grams") : t(item.unit === "kg" ? "units.kg" : "units.liter");
  return t("pages.plan.pack.multi", { packs, size, unit });
}
