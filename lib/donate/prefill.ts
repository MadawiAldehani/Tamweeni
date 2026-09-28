// What the family can give this month: the surplus of their saved pickup plan (entitled − planned),
// minus what they already pledged. Pure functions over the snapshot: no React, safe to import anywhere.
import type { Donation, Member, Snapshot } from "@/lib/data/types";
import { planMonthFor, savedPlanFor } from "@/lib/plan/month";
import { RATION_ITEMS, type RationItem, type RationItemId } from "@/lib/ration/catalog";
import { stepFor } from "@/lib/ration/consumption";
import { entitledQty, subsidyValue } from "@/lib/ration/entitlement";
import { mealsFor } from "@/lib/ration/meals";

export type DonationDraftLine = { item: RationItem; qty: number; maxQty: number };

export type DonationPrefill = {
  month: string;
  /** "plan": quantities come from the saved plan for `month`; "none": no plan yet, every item starts at 0. */
  source: "plan" | "none";
  lines: DonationDraftLine[];
};

/** Rounds DOWN to the pack step, so a pledge never exceeds the surplus. 2 dp avoids float noise. */
export function floorToStep(qty: number, step: number): number {
  return Number((Math.floor(qty / step + 1e-9) * step).toFixed(2));
}

/** Quantity already pledged or collected per item in a month. */
function pledgedByItem(donations: Donation[], month: string): Map<RationItemId, number> {
  const totals = new Map<RationItemId, number>();
  for (const d of donations) {
    if (d.month === month) totals.set(d.item_id, (totals.get(d.item_id) ?? 0) + d.qty);
  }
  return totals;
}

/**
 * One draft line, or null when the household is not entitled to the item at all.
 * `ceiling` is the most the family can give before this month's pledges: the plan surplus
 * (entitled − planned) with a plan, the whole entitlement without one.
 */
function draftLine(item: RationItem, members: Member[], pledged: Map<RationItemId, number>, ceiling: number): DonationDraftLine | null {
  const entitled = Number(entitledQty(item, members).toFixed(2));
  if (entitled <= 0) return null;
  const step = stepFor(item);
  // What is already pledged this month comes off the ceiling, so re-opening the picker after a
  // pledge never re-offers the same surplus; the stepper starts at the ceiling.
  const already = pledged.get(item.id) ?? 0;
  const maxQty = floorToStep(Math.max(0, ceiling - already), step);
  return { item, qty: maxQty, maxQty };
}

/**
 * Month: `planMonth` when given, else the month a new plan would be for.
 * With a saved plan for that month: one line per plan item, qty = maxQty = entitled − planned − already pledged,
 * items with nothing left to give dropped. Without a plan: every entitled item at 0 (up to the entitlement
 * minus pledges), for a manual pick.
 */
export function donationPrefill(snapshot: Snapshot, now: Date, planMonth?: string | null): DonationPrefill {
  const month = planMonth ?? planMonthFor(snapshot, now).month;
  const plan = savedPlanFor(snapshot, month);
  const { members } = snapshot;
  const pledged = pledgedByItem(snapshot.donations, month);

  if (plan) {
    const lines = RATION_ITEMS.flatMap((item) => {
      const planned = plan.lines.find((l) => l.item_id === item.id);
      if (!planned) return [];
      const surplus = Number((entitledQty(item, members) - planned.planned_qty).toFixed(2));
      const line = draftLine(item, members, pledged, surplus);
      // Items planned in full (no surplus) or already pledged in full stay out of the picker.
      return line && line.maxQty > 0 ? [line] : [];
    });
    return { month, source: "plan", lines };
  }

  const lines = RATION_ITEMS.flatMap((item) => {
    const line = draftLine(item, members, pledged, entitledQty(item, members));
    return line ? [{ ...line, qty: 0 }] : [];
  });
  return { month, source: "none", lines };
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
