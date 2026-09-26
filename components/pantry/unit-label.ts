import type { TKey } from "@/lib/i18n/translate";
import type { RationUnit } from "@/lib/ration/catalog";

/** Translated unit for a quantity; cans pluralise, kilos and litres do not. */
export function unitLabel(unit: RationUnit, qty: number, t: (key: TKey) => string): string {
  if (unit === "can") return t(qty === 1 ? "units.can" : "units.cans");
  return t(unit === "kg" ? "units.kg" : "units.liter");
}
