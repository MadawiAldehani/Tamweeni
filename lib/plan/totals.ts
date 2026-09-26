// Pure math over the editor state: what the family leaves, and what the plan is worth.
import type { Member, PlanWithLines } from "@/lib/data/types";
import { RATION_ITEMS, type RationItemId } from "@/lib/ration/catalog";
import type { Suggestion } from "@/lib/ration/consumption";
import { entitledQty, subsidyValue } from "@/lib/ration/entitlement";

export type Planned = Partial<Record<RationItemId, number>>;

export type PlanTotals = {
  /** Kilos left behind, counting litres as kilos; cans are excluded. */
  leavingKg: number;
  /** Subsidy value (KD) of everything left behind. */
  leavingKD: number;
  /** Subsidy value (KD) of what the family plans to take. */
  planKD: number;
  /** Items with a planned quantity above zero. */
  itemCount: number;
  takingEverything: boolean;
};

/** Planned quantities to start from: the saved plan for the month, else the suggestions. */
export function initialPlanned(suggestions: Suggestion[], saved: PlanWithLines | null): Planned {
  const planned: Planned = {};
  for (const s of suggestions) {
    const line = saved?.lines.find((l) => l.item_id === s.item.id);
    const qty = line ? line.planned_qty : s.suggestedQty;
    planned[s.item.id] = Math.min(s.entitledQty, Math.max(0, qty));
  }
  return planned;
}

export function plannedQty(planned: Planned, s: Suggestion): number {
  return planned[s.item.id] ?? s.suggestedQty;
}

export function planTotals(suggestions: Suggestion[], planned: Planned): PlanTotals {
  let leavingKg = 0;
  let leavingKD = 0;
  let planKD = 0;
  let itemCount = 0;
  for (const s of suggestions) {
    const qty = plannedQty(planned, s);
    const leaving = Math.max(0, s.entitledQty - qty);
    if (s.item.unit !== "can") leavingKg += leaving;
    leavingKD += subsidyValue(s.item, leaving);
    planKD += subsidyValue(s.item, qty);
    if (qty > 0) itemCount += 1;
  }
  const takingEverything = suggestions.every((s) => plannedQty(planned, s) >= s.entitledQty);
  return { leavingKg, leavingKD, planKD, itemCount, takingEverything };
}

export function toPlanLines(suggestions: Suggestion[], planned: Planned): { item_id: RationItemId; planned_qty: number }[] {
  return suggestions.map((s) => ({ item_id: s.item.id, planned_qty: plannedQty(planned, s) }));
}

/** Subsidy value (KD) a saved plan leaves behind: entitlement minus planned, per item. */
export function savedPlanLeavingKD(plan: PlanWithLines, members: Member[]): number {
  return RATION_ITEMS.reduce((sum, item) => {
    // Same 2 dp as suggestPickup, so 0.3 × 7 float noise never shows a phantom donation.
    const entitled = Number(entitledQty(item, members).toFixed(2));
    if (entitled <= 0) return sum;
    const planned = plan.lines.find((l) => l.item_id === item.id)?.planned_qty ?? 0;
    return sum + subsidyValue(item, Math.max(0, entitled - planned));
  }, 0);
}
