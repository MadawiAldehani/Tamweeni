// What the home screen should nudge the family toward next, and the one-sentence
// insight above it. Pure functions over a Snapshot; no React.
import { getItem, subsidyPerUnit, type RationItemId } from "@/lib/ration/catalog";
import { collectedByItem, monthSummary } from "@/lib/ration/entitlement";
import { addMonths, currentMonth, formatKD, formatNumber, todayISO } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import type { TKey, TVars } from "@/lib/i18n/translate";
import type { PantryCheckin, PickupWithLines, Snapshot } from "@/lib/data/types";

export type NextStep = "scan" | "checkin" | "plan" | "donate";

export type ItemUsage = {
  collected: number;
  /** From the latest check-in of the month, clamped to 0..collected; 0 when never checked in. */
  remaining: number;
  used: number;
  surplus: number;
};

/** Days a check-in should wait after a pickup before we ask for one. */
const CHECKIN_AFTER_DAYS = 7;
/** Below this many units a "surplus" isn't worth a donation trip. */
const MIN_SURPLUS = 0.5;

function daysBetween(fromISO: string, toISO: string): number {
  const [fy, fm, fd] = fromISO.split("-").map(Number);
  const [ty, tm, td] = toISO.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

function latestPickup(pickups: PickupWithLines[], month: string): PickupWithLines | undefined {
  return pickups
    .filter((p) => p.month === month)
    .sort((a, b) => a.pickup_date.localeCompare(b.pickup_date))
    .at(-1);
}

/** Check-ins between `month`'s latest pickup and the next month's (a pickup on the 25th checked in on the 2nd still counts). */
function checkinsForMonth(snapshot: Snapshot, month: string): PantryCheckin[] {
  const pickup = latestPickup(snapshot.pickups, month);
  if (!pickup) return [];
  const next = latestPickup(snapshot.pickups, addMonths(month, 1));
  return snapshot.checkins.filter(
    (c) => c.checkin_date >= pickup.pickup_date && (!next || c.checkin_date < next.pickup_date),
  );
}

/** Latest check-in per item attributed to `month`. */
function latestCheckins(snapshot: Snapshot, month: string): Map<RationItemId, PantryCheckin> {
  const latest = new Map<RationItemId, PantryCheckin>();
  for (const checkin of checkinsForMonth(snapshot, month)) {
    const current = latest.get(checkin.item_id);
    if (!current || checkin.checkin_date >= current.checkin_date) latest.set(checkin.item_id, checkin);
  }
  return latest;
}

/** Usage per item for one month: collected − what the latest check-in found remaining. */
export function estimateUsage(snapshot: Snapshot, month: string): Map<RationItemId, ItemUsage> {
  const collected = collectedByItem(snapshot.pickups, month);
  const checkins = latestCheckins(snapshot, month);
  const usage = new Map<RationItemId, ItemUsage>();
  const ids = new Set<RationItemId>([...collected.keys(), ...checkins.keys()]);
  for (const id of ids) {
    const got = collected.get(id) ?? 0;
    const remaining = Math.min(got, Math.max(0, checkins.get(id)?.qty_remaining ?? 0));
    const used = Math.max(0, got - remaining);
    usage.set(id, { collected: got, remaining, used, surplus: Math.max(0, got - used) });
  }
  return usage;
}

/**
 * The item whose surplus is worth the most subsidy. `netOfPledges` subtracts donations
 * already pledged in that month (for "is there still something to give now?"); the
 * last-month insight keeps the gross figure since the pattern is what matters.
 */
function bestSurplus(
  snapshot: Snapshot,
  month: string,
  netOfPledges: boolean,
): { id: RationItemId; usage: ItemUsage } | null {
  let best: { id: RationItemId; usage: ItemUsage; value: number } | null = null;
  for (const [id, usage] of estimateUsage(snapshot, month)) {
    const pledged = netOfPledges
      ? snapshot.donations.filter((d) => d.month === month && d.item_id === id).reduce((sum, d) => sum + d.qty, 0)
      : 0;
    const surplus = Math.max(0, usage.surplus - pledged);
    const value = surplus * subsidyPerUnit(getItem(id));
    if (surplus >= MIN_SURPLUS && (!best || value > best.value)) best = { id, usage: { ...usage, surplus }, value };
  }
  return best ? { id: best.id, usage: best.usage } : null;
}

/** True once the month's pickup is a week old and nobody has checked the pantry since. */
function checkinDue(snapshot: Snapshot, now: Date): boolean {
  const month = currentMonth(now);
  const pickup = latestPickup(snapshot.pickups, month);
  if (!pickup || checkinsForMonth(snapshot, month).length > 0) return false;
  return daysBetween(pickup.pickup_date, todayISO(now)) >= CHECKIN_AFTER_DAYS;
}

export function nextStep(snapshot: Snapshot, now: Date): NextStep {
  const month = currentMonth(now);
  const pickup = latestPickup(snapshot.pickups, month);
  if (!pickup) return "scan";
  // A check-in any time after the pickup (same day included) moves the story on to giving.
  if (checkinsForMonth(snapshot, month).length > 0) return bestSurplus(snapshot, month, true) ? "donate" : "plan";
  if (daysBetween(pickup.pickup_date, todayISO(now)) < CHECKIN_AFTER_DAYS) return "plan";
  return "checkin";
}

function unitLabel(id: RationItemId, t: (key: TKey, vars?: TVars) => string): string {
  const unit = getItem(id).unit;
  if (unit === "liter") return t("units.liter");
  if (unit === "can") return t("units.cans");
  return t("units.kg");
}

export function homeInsight(
  snapshot: Snapshot,
  now: Date,
  locale: Locale,
  t: (key: TKey, vars?: TVars) => string,
): string {
  if (snapshot.pickups.length === 0) return t("pages.home.insight.noData");

  // Sentence and "Next" badge must agree, so a due check-in wins over last month's pattern.
  if (checkinDue(snapshot, now)) return t("pages.home.insight.checkinDue");

  const month = currentMonth(now);
  const lastMonth = addMonths(month, -1);
  if (checkinsForMonth(snapshot, lastMonth).length > 0) {
    const best = bestSurplus(snapshot, lastMonth, false);
    if (best) {
      const item = getItem(best.id);
      const n = (value: number) => formatNumber(value, locale, 1);
      return t("pages.home.insight.surplus", {
        item: locale === "ar" ? item.name_ar : item.name_en.toLowerCase(),
        collected: n(best.usage.collected),
        used: n(best.usage.used),
        surplus: n(best.usage.surplus),
        unit: unitLabel(best.id, t),
      });
    }
  }

  const summary = monthSummary(snapshot.members, snapshot.pickups, month);
  return t("pages.home.insight.tracked", {
    collected: formatKD(summary.collectedKD, locale),
    entitled: formatKD(summary.entitledKD, locale),
  });
}
