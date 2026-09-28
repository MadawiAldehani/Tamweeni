// Pure math over the editor state: what the family needs and what is surplus. No money here:
// the plan page talks in kilos only; the subsidy value belongs to the Donate page.
import type { Member, PlanWithLines } from "@/lib/data/types";
import { formatNumber } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import type { TKey } from "@/lib/i18n/translate";
import { unitFor } from "@/lib/plan/units";
import { RATION_ITEMS, type RationItemId } from "@/lib/ration/catalog";
import type { Suggestion } from "@/lib/ration/consumption";
import { entitledQty } from "@/lib/ration/entitlement";

export type Planned = Partial<Record<RationItemId, number>>;

export type PlanTotals = {
  /** Kilos the family plans to take, counting litres as kilos; cans are excluded. */
  needKg: number;
  /** Kilos of the entitlement the family does not need (entitled − planned); litres count as kilos. */
  surplusKg: number;
  /** Cans (infant milk) the family does not need. */
  surplusCans: number;
  /** Items with a planned quantity above zero. */
  itemCount: number;
  takingEverything: boolean;
};

type Line = { unit: string; entitled: number; planned: number };

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

function totalsOf(lines: Line[]): PlanTotals {
  const totals: PlanTotals = { needKg: 0, surplusKg: 0, surplusCans: 0, itemCount: 0, takingEverything: true };
  for (const { unit, entitled, planned } of lines) {
    const surplus = Math.max(0, entitled - planned);
    if (unit === "can") totals.surplusCans += surplus;
    else {
      totals.needKg += Math.min(entitled, planned);
      totals.surplusKg += surplus;
    }
    if (planned > 0) totals.itemCount += 1;
    if (surplus > 0) totals.takingEverything = false;
  }
  return totals;
}

export function planTotals(suggestions: Suggestion[], planned: Planned): PlanTotals {
  return totalsOf(suggestions.map((s) => ({ unit: s.item.unit, entitled: s.entitledQty, planned: plannedQty(planned, s) })));
}

/** Totals of a saved plan against the current members: entitlement minus planned, per item. */
export function savedPlanTotals(plan: PlanWithLines, members: Member[]): PlanTotals {
  const lines: Line[] = [];
  for (const item of RATION_ITEMS) {
    // Same 2 dp as suggestPickup, so 0.3 × 7 float noise never shows a phantom surplus.
    const entitled = Number(entitledQty(item, members).toFixed(2));
    if (entitled <= 0) continue;
    const planned = plan.lines.find((l) => l.item_id === item.id)?.planned_qty ?? 0;
    lines.push({ unit: item.unit, entitled, planned });
  }
  return totalsOf(lines);
}

export function toPlanLines(suggestions: Suggestion[], planned: Planned): { item_id: RationItemId; planned_qty: number }[] {
  return suggestions.map((s) => ({ item_id: s.item.id, planned_qty: plannedQty(planned, s) }));
}

/** "24.8 kg", "24.8 kg + 2 cans" or "2 cans": the surplus with its units, ready for a {surplus} slot. */
export function formatSurplus(totals: PlanTotals, locale: Locale, t: (key: TKey) => string): string {
  const parts: string[] = [];
  if (totals.surplusKg > 0 || totals.surplusCans === 0) parts.push(`${formatNumber(totals.surplusKg, locale, 1)} ${t("units.kg")}`);
  if (totals.surplusCans > 0) parts.push(`${formatNumber(totals.surplusCans, locale, 0)} ${unitFor("can", totals.surplusCans, t)}`);
  return parts.join(" + ");
}
