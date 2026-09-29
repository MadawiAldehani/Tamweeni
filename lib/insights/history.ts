// Past-month evidence behind the pickup plan: what each family collected, used, left over,
// wasted and gave away in earlier months. Pure functions over a Snapshot; no React.
// The current month is never included — it is still in progress and would read as "leftovers".
import type { Snapshot } from "@/lib/data/types";
import { monthlySeries, type MonthPoint } from "@/lib/insights/series";
import { RATION_ITEM_IDS, getItem, type RationItemId } from "@/lib/ration/catalog";

export type ItemMonthHistory = {
  month: string;
  collected: number;
  /** Null when the month has no pantry check-in (leftover too). */
  used: number | null;
  /** What was still at home at the month's latest check-in. */
  leftover: number | null;
  wasted: number;
  donated: number;
};

export type HouseholdMonthHistory = {
  month: string;
  collectedKg: number;
  /** Null when the month has no pantry check-in (leftover and wasted too). */
  usedKg: number | null;
  /** Still at home at the month's latest check-in, net of what was given away since. */
  leftoverKg: number | null;
  wastedKg: number | null;
  /** Pledges exist without a check-in, so this is always a number. */
  donatedKg: number;
  hasCheckin: boolean;
};

/** Past months only, newest first: one extra point so the current month can be dropped. */
function pastMonths(snapshot: Snapshot, now: Date, count: number): MonthPoint[] {
  return monthlySeries(snapshot, now, count + 1).slice(0, -1).reverse();
}

/** One item's past months with a pickup, newest first (at most `count`). */
export function itemHistory(snapshot: Snapshot, now: Date, itemId: RationItemId, count = 3): ItemMonthHistory[] {
  const rows: ItemMonthHistory[] = [];
  for (const point of pastMonths(snapshot, now, count)) {
    const entry = point.items[itemId];
    if (entry.collected <= 0) continue;
    rows.push({
      month: point.month,
      collected: entry.collected,
      used: entry.used,
      leftover: entry.atHome,
      wasted: entry.wasted ?? 0,
      donated: entry.donated,
    });
  }
  return rows;
}

/** Household totals over kg + litre items (cans do not add up with kilos), newest first. */
export function householdHistory(snapshot: Snapshot, now: Date, count = 3): HouseholdMonthHistory[] {
  const ids = RATION_ITEM_IDS.filter((id) => getItem(id).unit !== "can");
  const rows: HouseholdMonthHistory[] = [];
  for (const point of pastMonths(snapshot, now, count)) {
    const checked = point.hasCheckin;
    const row: HouseholdMonthHistory = {
      month: point.month,
      collectedKg: 0,
      usedKg: checked ? 0 : null,
      leftoverKg: checked ? 0 : null,
      wastedKg: checked ? 0 : null,
      donatedKg: 0,
      hasCheckin: checked,
    };
    for (const id of ids) {
      const entry = point.items[id];
      row.collectedKg += entry.collected;
      row.donatedKg += entry.donated;
      if (!checked) continue;
      row.usedKg = (row.usedKg ?? 0) + (entry.used ?? 0);
      // Gifts come out of what was still at home, so they are not counted twice.
      row.leftoverKg = (row.leftoverKg ?? 0) + Math.max(0, (entry.atHome ?? 0) - entry.donated);
      row.wastedKg = (row.wastedKg ?? 0) + (entry.wasted ?? 0);
    }
    if (row.collectedKg <= 0) continue;
    rows.push(row);
  }
  return rows;
}
