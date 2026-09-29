// Live national aggregates for /impact. Server only (see lib/impact/load.ts for the
// service-role reads). Reuses the same per-household maths the app shows each family.
//   · not taken  = Σ over household-months WITH a pickup of max(0, entitled − collected), in kg
//                  (litres count as kg) and as subsidy value (KD) — what families LEFT for the country.
//   · donated    = leftovers already collected and given to the Food Bank (secondary line).
//   · over-collection = pooled Σ(collected − used) ÷ Σ collected over household-months with a check-in.
import type { Snapshot } from "@/lib/data/types";
import { addMonths, currentMonth } from "@/lib/format";
import type { GovernorateImpact, ImpactStats } from "@/lib/impact/types";
import { getItem } from "@/lib/ration/catalog";
import { monthSummary, quantityTotals, subsidyValue } from "@/lib/ration/entitlement";
import { GOVERNORATE_IDS, type Governorate } from "@/lib/ration/governorates";
import { checkinsForMonth, estimateUsage } from "@/lib/ration/insights";
import { loadSnapshots } from "@/lib/impact/load";

/** A governorate's rate is published only once this many households have usable data. */
const MIN_HOUSEHOLDS = 30;
const MONTHS_BACK = 3;

type Totals = { collected: number; used: number };
type NotTaken = { kg: number; kd: number };

/** Σ collected and Σ used over the household-months (last 3 months) that have a check-in. */
function householdTotals(snapshot: Snapshot, months: string[]): Totals | null {
  let collected = 0;
  let used = 0;
  let any = false;
  for (const month of months) {
    if (checkinsForMonth(snapshot, month).length === 0) continue;
    any = true;
    for (const usage of estimateUsage(snapshot, month).values()) {
      collected += usage.collected;
      used += usage.used;
    }
  }
  return any ? { collected, used } : null;
}

/**
 * What this household left in the system: over months where it actually went to the branch,
 * the entitlement it chose not to collect (kg + litres) and that quantity's subsidy value.
 * Months with no pickup are skipped — the family may simply not have gone yet.
 */
function householdNotTaken(snapshot: Snapshot, months: string[]): NotTaken {
  const totals: NotTaken = { kg: 0, kd: 0 };
  for (const month of months) {
    if (!snapshot.pickups.some((p) => p.month === month)) continue;
    const summary = monthSummary(snapshot.members, snapshot.pickups, month);
    const qty = quantityTotals(summary.items);
    totals.kg += Math.max(0, qty.entitledKg - qty.collectedKg);
    for (const row of summary.items) totals.kd += subsidyValue(row.item, Math.max(0, row.entitledQty - row.collectedQty));
  }
  return totals;
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
  const notTaken: NotTaken = { kg: 0, kd: 0 };
  let kgDonated = 0;
  let kdDonated = 0;

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
    const left = householdNotTaken(snapshot, months);
    notTaken.kg += left.kg;
    notTaken.kd += left.kd;
    for (const donation of snapshot.donations) {
      const item = getItem(donation.item_id);
      if (item.unit === "kg" || item.unit === "liter") kgDonated += donation.qty;
      kdDonated += subsidyValue(item, donation.qty);
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
    kgNotTaken: notTaken.kg,
    kdSaved: notTaken.kd,
    kgDonated,
    kdDonated,
    overCollectionRate: rate(national),
    governorates,
    updatedAt: now.toISOString(),
    source: "live",
  };
}
