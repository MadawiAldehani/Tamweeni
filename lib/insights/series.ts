// Series for the insights charts: entitled / collected / used per month and per item.
// Pure functions over a Snapshot; no React. Money is the subsidy value (what the state gives away).
import type { Snapshot } from "@/lib/data/types";
import { addMonths, currentMonth } from "@/lib/format";
import { RATION_ITEMS, RATION_ITEM_IDS, getItem, type RationItem, type RationItemId } from "@/lib/ration/catalog";
import { collectedByItem, entitledQty, subsidyValue } from "@/lib/ration/entitlement";
import { checkinsForMonth, estimateUsage } from "@/lib/ration/insights";

export type ItemPoint = { entitled: number; collected: number; used: number | null };

export type MonthPoint = {
  month: string;
  entitledKD: number;
  collectedKD: number;
  /** Null when no pantry check-in is attributed to the month. */
  usedKD: number | null;
  hasCheckin: boolean;
  items: Record<RationItemId, ItemPoint>;
};

function monthPoint(snapshot: Snapshot, month: string): MonthPoint {
  const hasCheckin = checkinsForMonth(snapshot, month).length > 0;
  const collected = collectedByItem(snapshot.pickups, month);
  const usage = hasCheckin ? estimateUsage(snapshot, month) : null;

  let entitledKD = 0;
  let collectedKD = 0;
  let usedKD = 0;
  const items = {} as Record<RationItemId, ItemPoint>;
  for (const item of RATION_ITEMS) {
    const entitled = entitledQty(item, snapshot.members);
    const got = collected.get(item.id) ?? 0;
    const used = usage ? (usage.get(item.id)?.used ?? 0) : null;
    items[item.id] = { entitled, collected: got, used };
    entitledKD += subsidyValue(item, entitled);
    collectedKD += subsidyValue(item, got);
    if (used !== null) usedKD += subsidyValue(item, used);
  }
  return { month, entitledKD, collectedKD, usedKD: hasCheckin ? usedKD : null, hasCheckin, items };
}

/** Oldest → newest, the current month last. */
export function monthlySeries(snapshot: Snapshot, now: Date, count = 3): MonthPoint[] {
  const thisMonth = currentMonth(now);
  return Array.from({ length: count }, (_, i) => monthPoint(snapshot, addMonths(thisMonth, i - (count - 1))));
}

export type WasteRow = {
  item: RationItem;
  collected: number;
  used: number;
  unused: number;
  /** unused / collected, 0..1 */
  unusedShare: number;
  monthsWithData: number;
};

/** Per-item totals over the months that have check-ins, ranked by the share left unused. */
export function wasteRisk(snapshot: Snapshot, now: Date, count = 3): WasteRow[] {
  const withData = monthlySeries(snapshot, now, count).filter((p) => p.hasCheckin);
  const rows: WasteRow[] = [];
  for (const id of RATION_ITEM_IDS) {
    let collected = 0;
    let used = 0;
    let monthsWithData = 0;
    for (const point of withData) {
      const entry = point.items[id];
      if (entry.collected <= 0) continue;
      collected += entry.collected;
      used += entry.used ?? 0;
      monthsWithData += 1;
    }
    if (collected <= 0) continue;
    const unused = Math.max(0, collected - used);
    rows.push({ item: getItem(id), collected, used, unused, unusedShare: unused / collected, monthsWithData });
  }
  return rows.sort((a, b) => b.unusedShare - a.unusedShare || b.unused - a.unused);
}

export type MoneySummary = {
  receivedKD: number;
  /** Null when no month has a check-in. */
  usedKD: number | null;
  /** Received − used, over the months that have a check-in only. */
  unusedKD: number;
};

export function moneySummary(points: MonthPoint[]): MoneySummary {
  const receivedKD = points.reduce((sum, p) => sum + p.collectedKD, 0);
  const withData = points.filter((p) => p.usedKD !== null);
  if (withData.length === 0) return { receivedKD, usedKD: null, unusedKD: 0 };
  const usedKD = withData.reduce((sum, p) => sum + (p.usedKD ?? 0), 0);
  const unusedKD = withData.reduce((sum, p) => sum + Math.max(0, p.collectedKD - (p.usedKD ?? 0)), 0);
  return { receivedKD, usedKD, unusedKD };
}
