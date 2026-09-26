// The "take what you need" model. Deliberately simple and explainable:
//   usage_month  = collected_that_month − qty_remaining_at_check-in   (clamp ≥ 0)
//   suggested    = clamp(avg_usage × 1.1 − current_pantry_estimate, 0, entitlement)
// Plus one refinement over the brief: a check-in taken d days after the pickup is
// pro-rated to a full month (× daysInMonth / d, d ≥ 7), so an early check-in reads as
// "you used X in a week" rather than "you used X in a month". Delete the pro-rating
// in `monthlyUsageFor` if you prefer the literal formula.
import type { PantryCheckin, PickupWithLines, Snapshot } from "@/lib/data/types";
import { addMonths, currentMonth } from "@/lib/format";
import { RATION_ITEMS, type RationItem, type RationItemId } from "@/lib/ration/catalog";
import { collectedByItem, entitledQty } from "@/lib/ration/entitlement";

const HEADROOM = 1.1;
const MIN_DAYS = 7;
const MONTHS_OF_HISTORY = 3;
const DAY_MS = 86_400_000;

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY_MS);
}

function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

/** Latest pickup date in a month, or null when the month has no pickup. */
function pickupDateFor(pickups: PickupWithLines[], month: string): string | null {
  const dates = pickups.filter((p) => p.month === month).map((p) => p.pickup_date).sort();
  return dates.at(-1) ?? null;
}

/** The latest check-in for an item taken on/after `since` (the month's pickup). */
function latestCheckin(checkins: PantryCheckin[], itemId: RationItemId, since: string, before: string | null): PantryCheckin | null {
  const inWindow = checkins
    .filter((c) => c.item_id === itemId && c.checkin_date >= since && (!before || c.checkin_date < before))
    .sort((a, b) => a.checkin_date.localeCompare(b.checkin_date));
  return inWindow.at(-1) ?? null;
}

export type MonthUsage = { month: string; collected: number; remaining: number; used: number; monthlyUsage: number };

/** Usage of one item in one month, pro-rated to a full month; null without a check-in. */
export function monthlyUsageFor(snapshot: Snapshot, itemId: RationItemId, month: string): MonthUsage | null {
  const pickupDate = pickupDateFor(snapshot.pickups, month);
  if (!pickupDate) return null;
  const nextPickup = pickupDateFor(snapshot.pickups, addMonths(month, 1));
  const checkin = latestCheckin(snapshot.checkins, itemId, pickupDate, nextPickup);
  if (!checkin) return null;

  const collected = collectedByItem(snapshot.pickups, month).get(itemId) ?? 0;
  const remaining = Math.min(collected, Math.max(0, checkin.qty_remaining));
  const used = Math.max(0, collected - remaining);
  const days = Math.max(MIN_DAYS, daysBetween(pickupDate, checkin.checkin_date));
  // Pro-rate to a full month (factor 1 when the check-in came a whole month after the pickup).
  const monthlyUsage = used * (daysInMonth(month) / Math.min(days, daysInMonth(month)));
  return { month, collected, remaining, used, monthlyUsage: Math.min(monthlyUsage, collected * 1.5) };
}

export type UsageEstimate = {
  /** Average pro-rated monthly usage over the months with data; null = nothing learned yet. */
  monthlyUsage: number | null;
  monthsOfData: number;
  /** Best guess of what is in the pantry right now, in catalog units. */
  pantryEstimate: number;
};

/** Learns from up to the last three months before `now`'s month. */
export function estimateUsage(snapshot: Snapshot, itemId: RationItemId, now: Date = new Date()): UsageEstimate {
  const thisMonth = currentMonth(now);
  const months = Array.from({ length: MONTHS_OF_HISTORY }, (_, i) => addMonths(thisMonth, -(i + 1)));
  const usages = months.map((m) => monthlyUsageFor(snapshot, itemId, m)).filter((u): u is MonthUsage => u !== null);
  const monthlyUsage = usages.length ? usages.reduce((s, u) => s + u.monthlyUsage, 0) / usages.length : null;

  // Pantry now: this month's check-in if any; otherwise last month's leftover minus what has been used since.
  const current = monthlyUsageFor(snapshot, itemId, thisMonth);
  let pantryEstimate = current ? current.remaining : 0;
  if (!current) {
    const last = usages.find((u) => u.month === months[0]);
    if (last && monthlyUsage !== null) {
      const lastCheckin = latestCheckin(snapshot.checkins, itemId, pickupDateFor(snapshot.pickups, last.month) ?? "", null);
      const daysSince = lastCheckin ? Math.max(0, daysBetween(lastCheckin.checkin_date, now.toISOString().slice(0, 10))) : 0;
      pantryEstimate = Math.max(0, last.remaining - (monthlyUsage * daysSince) / daysInMonth(last.month));
    }
  }
  return { monthlyUsage, monthsOfData: usages.length, pantryEstimate };
}

/** Quantities are taken in packs at the branch: litres and cans by the unit, kilos in sensible steps. */
export function stepFor(item: RationItem): number {
  if (item.unit !== "kg") return 1;
  return item.qty_per_person >= 1 ? 1 : item.qty_per_person;
}

export function roundToStep(qty: number, step: number): number {
  return Number((Math.round(qty / step) * step).toFixed(2));
}

export type Suggestion = {
  item: RationItem;
  entitledQty: number;
  suggestedQty: number;
  /** entitled − suggested: what the family could leave (or donate). */
  leavingQty: number;
  usage: UsageEstimate;
  /** True while there is no check-in history for this item. */
  learning: boolean;
};

/** One suggestion per item the household is entitled to. */
export function suggestPickup(snapshot: Snapshot, now: Date = new Date()): Suggestion[] {
  return RATION_ITEMS.map((item) => {
    const entitled = entitledQty(item, snapshot.members);
    if (entitled <= 0) return null;
    const usage = estimateUsage(snapshot, item.id, now);
    const learning = usage.monthlyUsage === null;
    const raw = learning ? entitled : usage.monthlyUsage! * HEADROOM - usage.pantryEstimate;
    const suggested = Math.min(entitled, Math.max(0, roundToStep(raw, stepFor(item))));
    return { item, entitledQty: entitled, suggestedQty: suggested, leavingQty: Math.max(0, entitled - suggested), usage, learning };
  }).filter((s): s is Suggestion => s !== null);
}
