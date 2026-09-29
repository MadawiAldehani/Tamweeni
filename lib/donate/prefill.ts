// What the family can give: leftovers of what they ALREADY collected (this month's pickup, or the
// most recent one), minus what they already pledged for that month. Donation is optional and never
// derived from the pickup plan — Tamweeni never suggests taking more in order to give.
// Pure functions over the snapshot: no React, safe to import anywhere.
import type { Donation, PickupWithLines, Snapshot } from "@/lib/data/types";
import { currentMonth } from "@/lib/format";
import { RATION_ITEMS, type RationItem, type RationItemId } from "@/lib/ration/catalog";
import { stepFor } from "@/lib/ration/consumption";
import { subsidyValue } from "@/lib/ration/entitlement";
import { latestCheckins } from "@/lib/ration/insights";
import { mealsFor } from "@/lib/ration/meals";

export type DonationDraftLine = { item: RationItem; qty: number; maxQty: number };

export type DonationPrefill = {
  month: string;
  /** "collected": lines are what was collected in `month`; "none": no pickup recorded at all. */
  source: "collected" | "none";
  lines: DonationDraftLine[];
};

/** Rounds DOWN to the pack step, so a pledge never exceeds what was collected. 2 dp avoids float noise. */
export function floorToStep(qty: number, step: number): number {
  return Number((Math.floor(qty / step + 1e-9) * step).toFixed(2));
}

/** Quantity per item summed over the given month: pledged (or collected by the Food Bank) donations. */
function pledgedByItem(donations: Donation[], month: string): Map<RationItemId, number> {
  const totals = new Map<RationItemId, number>();
  for (const d of donations) {
    if (d.month === month) totals.set(d.item_id, (totals.get(d.item_id) ?? 0) + d.qty);
  }
  return totals;
}

/** Quantity per item collected across every pickup of a month. */
function collectedByItem(pickups: PickupWithLines[], month: string): Map<RationItemId, number> {
  const totals = new Map<RationItemId, number>();
  for (const p of pickups) {
    if (p.month !== month) continue;
    for (const l of p.lines) totals.set(l.item_id, (totals.get(l.item_id) ?? 0) + l.qty);
  }
  return totals;
}

/** The latest month with a pickup: this month when it has one, else the most recent past month; null with no pickups. */
export function leftoverMonthFor(snapshot: Snapshot, now: Date): string | null {
  const thisMonth = currentMonth(now);
  const months = [...new Set(snapshot.pickups.map((p) => p.month))].sort();
  const past = months.filter((m) => m <= thisMonth);
  return past.at(-1) ?? months.at(-1) ?? null;
}

/**
 * One line per item collected in the leftover month, starting at 0 (the family picks what is
 * really left over), capped at collected − already pledged that month, rounded down to the pack
 * step. When a pantry check-in exists for that month the cap is what it found remaining instead
 * of what was collected, so a pledge can never exceed what is actually in the pantry. Items with
 * nothing left to give are dropped. Without any pickup: source "none", no lines.
 */
export function donationPrefill(snapshot: Snapshot, now: Date): DonationPrefill {
  const month = leftoverMonthFor(snapshot, now);
  if (month === null) return { month: currentMonth(now), source: "none", lines: [] };

  const collected = collectedByItem(snapshot.pickups, month);
  const pledged = pledgedByItem(snapshot.donations, month);
  const checkins = latestCheckins(snapshot, month);
  const lines = RATION_ITEMS.flatMap((item) => {
    const got = collected.get(item.id) ?? 0;
    if (got <= 0) return [];
    const remaining = checkins.get(item.id)?.qty_remaining;
    const available = (remaining === undefined ? got : Math.min(got, Math.max(0, remaining))) - (pledged.get(item.id) ?? 0);
    const maxQty = floorToStep(available, stepFor(item));
    return maxQty > 0 ? [{ item, qty: 0, maxQty }] : [];
  });
  return { month, source: "collected", lines };
}

export type DraftTotals = {
  /** Kilos given, counting litres as kilos; cans are excluded. */
  kg: number;
  /** Subsidy value (KD) of everything given. */
  kd: number;
  meals: number;
  /** Lines with a quantity above zero. */
  count: number;
};

export function draftTotals(lines: DonationDraftLine[]): DraftTotals {
  const totals: DraftTotals = { kg: 0, kd: 0, meals: 0, count: 0 };
  for (const { item, qty } of lines) {
    if (qty <= 0) continue;
    if (item.unit === "kg" || item.unit === "liter") totals.kg += qty;
    totals.kd += subsidyValue(item, qty);
    totals.meals += mealsFor(item.id, qty);
    totals.count += 1;
  }
  return totals;
}
