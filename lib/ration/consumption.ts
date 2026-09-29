// The "take what you need" model. Deliberately simple and explainable:
//   usage_month  = collected_that_month − qty_remaining_at_check-in − qty_wasted_at_check-in   (clamp ≥ 0)
//                  (waste is what expired or was thrown away; it is not "used", so it never
//                  inflates the suggestion for next month)
//   suggested    = clamp(avg_usage × 1.1 − current_pantry_estimate, 0, entitlement)
// Plus two refinements over the brief:
//   • a check-in taken d days after the pickup is pro-rated to a full month
//     (× daysInMonth / d, d ≥ 7, never above what was collected), so an early check-in
//     reads as "you used X in a week" rather than "you used X in a month";
//   • the pantry estimate is the latest check-in's leftover minus what has been eaten
//     since (avg_usage × days / daysInMonth), whichever month that check-in belongs to.
// The suggestion is rounded UP to the pack step, so a small shortfall never becomes zero.
// Delete the pro-rating in `monthlyUsageFor` if you prefer the literal formula.
import type { Snapshot } from "@/lib/data/types";
import { addMonths, currentMonth, todayISO } from "@/lib/format";
import { RATION_ITEMS, type RationItem, type RationItemId } from "@/lib/ration/catalog";
import { collectedByItem, entitledQty } from "@/lib/ration/entitlement";
import { latestCheckins, latestPickup } from "@/lib/ration/insights";

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

export type MonthUsage = {
  month: string;
  collected: number;
  remaining: number;
  /** Expired or thrown away per the check-in (0 for older records). */
  wasted: number;
  /** collected − remaining − wasted, clamp ≥ 0. */
  used: number;
  monthlyUsage: number;
  checkinDate: string;
};

/** Usage of one item in one month, pro-rated to a full month; null without a check-in (attribution rule: insights.ts). */
export function monthlyUsageFor(snapshot: Snapshot, itemId: RationItemId, month: string): MonthUsage | null {
  const pickup = latestPickup(snapshot.pickups, month);
  if (!pickup) return null;
  const checkin = latestCheckins(snapshot, month).get(itemId);
  if (!checkin) return null;
  const pickupDate = pickup.pickup_date;

  const collected = collectedByItem(snapshot.pickups, month).get(itemId) ?? 0;
  const remaining = Math.min(collected, Math.max(0, checkin.qty_remaining));
  const wasted = Math.min(collected, Math.max(0, checkin.qty_wasted ?? 0));
  const used = Math.max(0, collected - remaining - wasted);
  const days = Math.max(MIN_DAYS, daysBetween(pickupDate, checkin.checkin_date));
  // Pro-rate to a full month (factor 1 when the check-in came a whole month after the pickup).
  // A family cannot be shown using more than it collected.
  const monthlyUsage = Math.min(collected, used * (daysInMonth(month) / Math.min(days, daysInMonth(month))));
  return { month, collected, remaining, wasted, used, monthlyUsage, checkinDate: checkin.checkin_date };
}

export type UsageEstimate = {
  /** Average pro-rated monthly usage over the months with data; null = nothing learned yet. */
  monthlyUsage: number | null;
  monthsOfData: number;
  /** Best guess of what is in the pantry right now, in catalog units. */
  pantryEstimate: number;
};

/** Leftover at a check-in minus what has been eaten since, at `rate` per month. */
function pantrySince(checkin: MonthUsage, rate: number, now: Date): number {
  const daysSince = Math.max(0, daysBetween(checkin.checkinDate, todayISO(now)));
  return Math.max(0, checkin.remaining - (rate * daysSince) / daysInMonth(checkin.month));
}

/** Learns from up to the last three months before `now`'s month. */
export function estimateItemUsage(snapshot: Snapshot, itemId: RationItemId, now: Date = new Date()): UsageEstimate {
  const thisMonth = currentMonth(now);
  const months = Array.from({ length: MONTHS_OF_HISTORY }, (_, i) => addMonths(thisMonth, -(i + 1)));
  const usages = months.map((m) => monthlyUsageFor(snapshot, itemId, m)).filter((u): u is MonthUsage => u !== null);
  const monthlyUsage = usages.length ? usages.reduce((s, u) => s + u.monthlyUsage, 0) / usages.length : null;

  // Pantry now: the latest check-in (this month's, else last month's) decayed by the days since it.
  const current = monthlyUsageFor(snapshot, itemId, thisMonth);
  const latest = current ?? usages.find((u) => u.month === months[0]) ?? null;
  const rate = monthlyUsage ?? current?.monthlyUsage ?? null;
  const pantryEstimate = latest && rate !== null ? pantrySince(latest, rate, now) : (latest?.remaining ?? 0);
  return { monthlyUsage, monthsOfData: usages.length, pantryEstimate };
}

/** Quantities are taken in packs at the branch: whole units, or the pack for fractional quotas (2.27 kg tin, 300 g, 500 g). */
export function stepFor(item: RationItem): number {
  return Number.isInteger(item.qty_per_person) ? 1 : item.qty_per_person;
}

export function roundToStep(qty: number, step: number): number {
  return Number((Math.round(qty / step) * step).toFixed(2));
}

/** Rounds up to the next step, so any shortfall becomes at least one pack. */
export function ceilToStep(qty: number, step: number): number {
  return Number((Math.ceil(qty / step - 1e-9) * step).toFixed(2));
}

export type Suggestion = {
  item: RationItem;
  entitledQty: number;
  suggestedQty: number;
  /** entitled − suggested: what the family leaves in the system this month (subsidy saved for Kuwait). Never used by the Donate page. */
  surplusQty: number;
  usage: UsageEstimate;
  /** True while there is no check-in history for this item. */
  learning: boolean;
};

/** One suggestion per item the household is entitled to. */
export function suggestPickup(snapshot: Snapshot, now: Date = new Date()): Suggestion[] {
  return RATION_ITEMS.map((item) => {
    // 2 dp keeps 2.27 × 7 from becoming 15.889999…, which would never match a stepper value.
    const entitled = Number(entitledQty(item, snapshot.members).toFixed(2));
    if (entitled <= 0) return null;
    const usage = estimateItemUsage(snapshot, item.id, now);
    const learning = usage.monthlyUsage === null;
    const raw = learning ? entitled : usage.monthlyUsage! * HEADROOM - usage.pantryEstimate;
    const suggested = Math.min(entitled, raw > 0 ? ceilToStep(raw, stepFor(item)) : 0);
    return { item, entitledQty: entitled, suggestedQty: suggested, surplusQty: Math.max(0, entitled - suggested), usage, learning };
  }).filter((s): s is Suggestion => s !== null);
}
