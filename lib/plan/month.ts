// Which month a new plan is for: this month until the family has collected, then next month.
import type { PickupWithLines, PlanWithLines, Snapshot } from "@/lib/data/types";
import { addMonths, currentMonth } from "@/lib/format";

export type PlanMonth = {
  month: string;
  /** True when this month already has a pickup, so the plan moved to next month. */
  shifted: boolean;
};

export function hasPickupIn(pickups: PickupWithLines[], month: string): boolean {
  return pickups.some((p) => p.month === month);
}

export function planMonthFor(snapshot: Snapshot, now: Date): PlanMonth {
  const thisMonth = currentMonth(now);
  const shifted = hasPickupIn(snapshot.pickups, thisMonth);
  return { month: shifted ? addMonths(thisMonth, 1) : thisMonth, shifted };
}

export function savedPlanFor(snapshot: Snapshot, month: string): PlanWithLines | null {
  return snapshot.plans.find((p) => p.month === month) ?? null;
}
