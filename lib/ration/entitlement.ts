// Entitlement and month math. Pure functions over the catalog and a household's data.
import { RATION_ITEMS, subsidyPerUnit, type RationItem, type RationItemId } from "@/lib/ration/catalog";
import type { Member, PickupWithLines } from "@/lib/data/types";

/** Infant items count only members flagged as infants; everything else counts everyone. */
export function eligibleCount(item: RationItem, members: Member[]): number {
  return item.eligibility === "infant" ? members.filter((m) => m.is_infant).length : members.length;
}

export function entitledQty(item: RationItem, members: Member[]): number {
  return item.qty_per_person * eligibleCount(item, members);
}

/** What the state gives away on this quantity: (market − subsidized) × qty. */
export function subsidyValue(item: RationItem, qty: number): number {
  return qty * subsidyPerUnit(item);
}

export type ItemMonth = {
  item: RationItem;
  entitledQty: number;
  collectedQty: number;
  /** entitled − collected, never negative. */
  remainingQty: number;
  entitledKD: number;
  collectedKD: number;
};

export type MonthSummary = {
  month: string;
  entitledKD: number;
  collectedKD: number;
  remainingKD: number;
  /** Only items the household is eligible for (entitledQty > 0). */
  items: ItemMonth[];
};

/** Quantity collected per item across all pickups that count toward `month`. */
export function collectedByItem(pickups: PickupWithLines[], month: string): Map<RationItemId, number> {
  const totals = new Map<RationItemId, number>();
  for (const pickup of pickups) {
    if (pickup.month !== month) continue;
    for (const line of pickup.lines) {
      totals.set(line.item_id, (totals.get(line.item_id) ?? 0) + line.qty);
    }
  }
  return totals;
}

export function monthSummary(members: Member[], pickups: PickupWithLines[], month: string): MonthSummary {
  const collected = collectedByItem(pickups, month);
  const items: ItemMonth[] = RATION_ITEMS.map((item) => {
    const entitled = entitledQty(item, members);
    const got = collected.get(item.id) ?? 0;
    return {
      item,
      entitledQty: entitled,
      collectedQty: got,
      remainingQty: Math.max(0, entitled - got),
      entitledKD: subsidyValue(item, entitled),
      collectedKD: subsidyValue(item, got),
    };
  }).filter((row) => row.entitledQty > 0 || row.collectedQty > 0);

  const entitledKD = items.reduce((sum, row) => sum + row.entitledKD, 0);
  const collectedKD = items.reduce((sum, row) => sum + row.collectedKD, 0);
  return { month, entitledKD, collectedKD, remainingKD: Math.max(0, entitledKD - collectedKD), items };
}

/** Monthly subsidy value of the full entitlement — the "KD X per month" shown during onboarding. */
export function monthlySubsidyKD(members: Member[]): number {
  return RATION_ITEMS.reduce((sum, item) => sum + subsidyValue(item, entitledQty(item, members)), 0);
}
