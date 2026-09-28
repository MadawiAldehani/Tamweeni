// Pure helpers for the pantry check-in screen: which items to show, their slider step,
// the value the slider starts at, and the day count since the pickup. No React.
import type { PantryCheckin, PickupWithLines, Snapshot } from "@/lib/data/types";
import { todayISO } from "@/lib/format";
import type { RationItem, RationItemId, RationUnit } from "@/lib/ration/catalog";
import { monthSummary } from "@/lib/ration/entitlement";

export type PantryRow = {
  item: RationItem;
  collected: number;
  step: number;
  /** Latest check-in this month if any, else everything collected (nothing used yet). */
  initial: number;
  /** Waste recorded on that latest check-in, else 0 (older check-ins carry no waste). */
  initialWasted: number;
};

/** Kilos slide in 100 g below 5 kg and half-kilos above; litres and cans by the unit. */
export function sliderStep(unit: RationUnit, collected: number): number {
  if (unit !== "kg") return 1;
  return collected <= 5 ? 0.1 : 0.5;
}

/** Pickups that count toward `month`, oldest first. */
export function pickupsFor(pickups: PickupWithLines[], month: string): PickupWithLines[] {
  return pickups.filter((p) => p.month === month).sort((a, b) => a.pickup_date.localeCompare(b.pickup_date));
}

/** The month's latest check-in per item, taken on or after the month's latest pickup. */
function latestCheckins(checkins: PantryCheckin[], since: string): Map<RationItemId, PantryCheckin> {
  const latest = new Map<RationItemId, PantryCheckin>();
  for (const checkin of checkins) {
    if (checkin.checkin_date < since) continue;
    const current = latest.get(checkin.item_id);
    if (!current || checkin.checkin_date >= current.checkin_date) latest.set(checkin.item_id, checkin);
  }
  return latest;
}

/** One row per item collected this month, in catalog order. */
export function buildPantryRows(snapshot: Snapshot, month: string): PantryRow[] {
  const pickups = pickupsFor(snapshot.pickups, month);
  const since = pickups.at(-1)?.pickup_date ?? "";
  const checkins = since ? latestCheckins(snapshot.checkins, since) : new Map<RationItemId, PantryCheckin>();
  return monthSummary(snapshot.members, snapshot.pickups, month)
    .items.filter((row) => row.collectedQty > 0)
    .map((row) => {
      const collected = Number(row.collectedQty.toFixed(2));
      const checkin = checkins.get(row.item.id);
      const initial = checkin ? Math.min(collected, Math.max(0, checkin.qty_remaining)) : collected;
      const initialWasted = checkin ? Math.min(Math.max(0, checkin.qty_wasted ?? 0), Math.max(0, collected - initial)) : 0;
      return { item: row.item, collected, step: sliderStep(row.item.unit, collected), initial, initialWasted };
    });
}

/** Whole days from an ISO date to `now` (never negative). */
export function daysSince(iso: string, now: Date): number {
  const [y, m, d] = iso.split("-").map(Number);
  const [ty, tm, td] = todayISO(now).split("-").map(Number);
  return Math.max(0, Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(y, m - 1, d)) / 86_400_000));
}

/** Slider positions the family has touched; untouched rows fall back to `initial`. */
export type PantryValues = Partial<Record<RationItemId, number>>;

/** Expired / thrown-away quantities the family entered; untouched rows fall back to `initialWasted`. */
export type PantryWaste = Partial<Record<RationItemId, number>>;

/** Waste steps in half-kilos for kilos and whole units for litres and cans. */
export function wasteStep(unit: RationUnit): number {
  return unit === "kg" ? 0.5 : 1;
}

/** Waste can never exceed what is not still in the pantry: remaining + wasted ≤ collected. */
export function clampWaste(row: PantryRow, remaining: number, wasted: number): number {
  return Number(Math.min(Math.max(0, wasted), Math.max(0, row.collected - remaining)).toFixed(2));
}

function remainingOf(row: PantryRow, values: PantryValues): number {
  return values[row.item.id] ?? row.initial;
}

function wastedOf(row: PantryRow, values: PantryValues, waste: PantryWaste): number {
  return clampWaste(row, remainingOf(row, values), waste[row.item.id] ?? row.initialWasted);
}

/** used = collected − remaining − wasted, never below 0. */
export function usedOf(row: PantryRow, values: PantryValues, waste: PantryWaste): number {
  return Math.max(0, row.collected - remainingOf(row, values) - wastedOf(row, values, waste));
}

/** Rough "kg used" figure: kilos plus litres, cans left out. */
export function usedVolume(rows: PantryRow[], values: PantryValues, waste: PantryWaste): number {
  return rows.reduce((sum, row) => (row.item.unit === "can" ? sum : sum + usedOf(row, values, waste)), 0);
}

/** Same rough figure for what expired or was thrown away. */
export function wastedVolume(rows: PantryRow[], values: PantryValues, waste: PantryWaste): number {
  return rows.reduce((sum, row) => (row.item.unit === "can" ? sum : sum + wastedOf(row, values, waste)), 0);
}

export type UsedItem = { id: RationItemId; used: number };

/** Quantity used per item in this check-in, most used first (untouched rows read 0). */
export function usedByItem(rows: PantryRow[], values: PantryValues, waste: PantryWaste): UsedItem[] {
  return rows
    .map((row) => ({ id: row.item.id, used: usedOf(row, values, waste) }))
    .sort((a, b) => b.used - a.used);
}
