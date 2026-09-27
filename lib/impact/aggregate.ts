// Live national aggregates for /impact. Server only (see lib/impact/load.ts for the
// service-role reads). Reuses the same per-household maths the app shows each family:
// a pooled Σ(collected − used) ÷ Σ collected over household-months that have a check-in.
import type { PantryCheckin, PickupWithLines, Snapshot } from "@/lib/data/types";
import { addMonths, currentMonth } from "@/lib/format";
import type { GovernorateImpact, ImpactStats } from "@/lib/impact/types";
import { getItem } from "@/lib/ration/catalog";
import { subsidyValue } from "@/lib/ration/entitlement";
import { GOVERNORATE_IDS, type Governorate } from "@/lib/ration/governorates";
import { estimateUsage } from "@/lib/ration/insights";
import { loadSnapshots } from "@/lib/impact/load";

/** A governorate's rate is published only once this many households have usable data. */
const MIN_HOUSEHOLDS = 30;
const MONTHS_BACK = 3;

type Totals = { collected: number; used: number };

function latestPickup(pickups: PickupWithLines[], month: string): PickupWithLines | undefined {
  return pickups.filter((p) => p.month === month).sort((a, b) => a.pickup_date.localeCompare(b.pickup_date)).at(-1);
}

/** Mirrors insights.ts: a month "has a check-in" when one falls between its pickup and the next month's. */
function hasCheckin(snapshot: Snapshot, month: string): boolean {
  const pickup = latestPickup(snapshot.pickups, month);
  if (!pickup) return false;
  const next = latestPickup(snapshot.pickups, addMonths(month, 1));
  return snapshot.checkins.some(
    (c: PantryCheckin) => c.checkin_date >= pickup.pickup_date && (!next || c.checkin_date < next.pickup_date),
  );
}

/** Σ collected and Σ used over the household-months (last 3 months) that have a check-in. */
function householdTotals(snapshot: Snapshot, months: string[]): Totals | null {
  let collected = 0;
  let used = 0;
  let any = false;
  for (const month of months) {
    if (!hasCheckin(snapshot, month)) continue;
    any = true;
    for (const usage of estimateUsage(snapshot, month).values()) {
      collected += usage.collected;
      used += usage.used;
    }
  }
  return any ? { collected, used } : null;
}

function rate(totals: Totals): number | null {
  return totals.collected > 0 ? Math.max(0, totals.collected - totals.used) / totals.collected : null;
}

export async function aggregateImpact(now: Date = new Date()): Promise<ImpactStats> {
  const thisMonth = currentMonth(now);
  const months = Array.from({ length: MONTHS_BACK }, (_, i) => addMonths(thisMonth, -i));
  const snapshots = await loadSnapshots(months, addMonths(thisMonth, 1));

  const national: Totals = { collected: 0, used: 0 };
  const perGov = new Map<Governorate, { households: number; withData: number; totals: Totals }>(
    GOVERNORATE_IDS.map((id) => [id, { households: 0, withData: 0, totals: { collected: 0, used: 0 } }]),
  );
  let kgPledged = 0;
  let kdRedirected = 0;

  for (const snapshot of snapshots) {
    const gov = perGov.get(snapshot.household?.governorate ?? "capital");
    if (gov) gov.households += 1;
    const totals = householdTotals(snapshot, months);
    if (totals) {
      national.collected += totals.collected;
      national.used += totals.used;
      if (gov) {
        gov.withData += 1;
        gov.totals.collected += totals.collected;
        gov.totals.used += totals.used;
      }
    }
    for (const donation of snapshot.donations) {
      const item = getItem(donation.item_id);
      if (item.unit === "kg" || item.unit === "liter") kgPledged += donation.qty;
      kdRedirected += subsidyValue(item, donation.qty);
    }
  }

  const governorates: GovernorateImpact[] = GOVERNORATE_IDS.map((id) => {
    const gov = perGov.get(id)!;
    return {
      id,
      households: gov.households,
      overCollectionRate: gov.withData >= MIN_HOUSEHOLDS ? rate(gov.totals) : null,
    };
  });

  return {
    households: snapshots.length,
    kgPledged,
    kdRedirected,
    overCollectionRate: rate(national),
    governorates,
    updatedAt: now.toISOString(),
    source: "live",
  };
}
