// What the family can give this month, pre-filled from their plan or from what Tamweeni learned.
// Pure functions over the snapshot: no React, safe to import anywhere.
import type { Donation, Member, Snapshot } from "@/lib/data/types";
import { planMonthFor, savedPlanFor } from "@/lib/plan/month";
import { RATION_ITEMS, type RationItem, type RationItemId } from "@/lib/ration/catalog";
import { stepFor, suggestPickup } from "@/lib/ration/consumption";
import { entitledQty, subsidyValue } from "@/lib/ration/entitlement";
import { mealsFor } from "@/lib/ration/meals";

export type DonationDraftLine = { item: RationItem; qty: number; maxQty: number };

export type DonationPrefill = {
  month: string;
  source: "plan" | "suggestion" | "none";
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

/** One draft line, or null when the household is not entitled to the item at all. */
function draftLine(item: RationItem, members: Member[], pledged: Map<RationItemId, number>, wanted: number): DonationDraftLine | null {
  const entitled = Number(entitledQty(item, members).toFixed(2));
  if (entitled <= 0) return null;
  const step = stepFor(item);
  // What is already pledged this month comes off both the ceiling and the pre-filled amount,
  // so re-opening the picker after a pledge never re-offers the same surplus.
  const already = pledged.get(item.id) ?? 0;
  const maxQty = floorToStep(Math.max(0, entitled - already), step);
  const qty = floorToStep(Math.min(maxQty, Math.max(0, wanted - already)), step);
  return { item, qty, maxQty };
}

/**
 * Month: `planMonth` when a plan is saved for it, else the month a new plan would be for.
 * Lines: the plan's leaving, else the learned suggestion's leaving, else every entitled item at 0.
 * `maxQty` is the entitlement minus what is already pledged for that month; `qty` subtracts it too.
 */
export function donationPrefill(snapshot: Snapshot, now: Date, planMonth?: string | null): DonationPrefill {
  const requested = planMonth ? savedPlanFor(snapshot, planMonth) : null;
  const month = requested ? requested.month : planMonthFor(snapshot, now).month;
  const plan = requested ?? savedPlanFor(snapshot, month);
  const { members } = snapshot;
  const pledged = pledgedByItem(snapshot.donations, month);
  const build = (wantedFor: (item: RationItem) => number) =>
    RATION_ITEMS.map((item) => draftLine(item, members, pledged, wantedFor(item))).filter(
      (line): line is DonationDraftLine => line !== null,
    );

  if (plan) {
    // An item missing from the plan is not being taken, so all of it is left behind.
    const plannedFor = (item: RationItem) => plan.lines.find((l) => l.item_id === item.id)?.planned_qty ?? 0;
    const lines = build((item) => entitledQty(item, members) - plannedFor(item));
    if (lines.some((l) => l.qty > 0)) return { month, source: "plan", lines: lines.filter((l) => l.qty > 0) };
  }

  const leaving = new Map(suggestPickup(snapshot, now).map((s) => [s.item.id, s.leavingQty]));
  const suggested = build((item) => leaving.get(item.id) ?? 0);
  if (suggested.some((l) => l.qty > 0)) return { month, source: "suggestion", lines: suggested.filter((l) => l.qty > 0) };

  return { month, source: "none", lines: build(() => 0) };
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
