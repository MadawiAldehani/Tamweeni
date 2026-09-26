// Turns donated quantities into the "meals" headline the Food Bank cards show.
// Pure functions: no React, safe to import from server code.
import { getItem, type RationItemId } from "@/lib/ration/catalog";
import { subsidyValue } from "@/lib/ration/entitlement";
import type { Donation } from "@/lib/data/types";

/**
 * Approximate meals one unit of each item contributes. Rough kitchen math
 * (a serving of rice is ~125 g, a chicken portion ~250 g, a can of paste
 * seasons two pots…); good enough for an impact headline, not for nutrition.
 */
export const MEALS_PER_UNIT: Record<RationItemId, number> = {
  rice: 8, // per kg
  chicken: 4, // per kg
  sugar: 20, // per kg
  oil: 10, // per liter
  milk_powder: 15, // per kg
  milk_longlife: 3, // per liter
  tomato_paste: 2, // per can (135 g)
  lentils: 8, // per kg
  dates: 6, // per kg
  infant_milk: 8, // per can
  infant_food: 4, // per can
};

export function mealsFor(itemId: RationItemId, qty: number): number {
  return qty * MEALS_PER_UNIT[itemId];
}

export type SadaqaTotals = {
  /** Kilograms given. Litres count as kilograms for the headline (oil and milk are ~1 kg/L). */
  kg: number;
  /** Subsidy value of what was given, in KD. */
  kd: number;
  meals: number;
  /** Number of pledges (distinct voucher codes), not rows. */
  count: number;
};

export function sadaqaTotals(donations: Donation[]): SadaqaTotals {
  let kg = 0;
  let kd = 0;
  let meals = 0;
  const vouchers = new Set<string>();
  for (const donation of donations) {
    const item = getItem(donation.item_id);
    if (item.unit === "kg" || item.unit === "liter") kg += donation.qty;
    kd += subsidyValue(item, donation.qty);
    meals += mealsFor(donation.item_id, donation.qty);
    vouchers.add(donation.voucher_code);
  }
  return { kg, kd, meals, count: vouchers.size };
}
