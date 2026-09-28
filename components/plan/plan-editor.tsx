"use client";

import { useMemo, useState, type CSSProperties } from "react";

import { PlanItemRow } from "@/components/plan/plan-item-row";
import { PlanLearningBanner } from "@/components/plan/plan-learning-banner";
import { PlanMonthChip } from "@/components/plan/plan-month-chip";
import { PlanSummaryBar } from "@/components/plan/plan-summary-bar";
import { useData } from "@/lib/data/provider";
import type { PlanWithLines } from "@/lib/data/types";
import type { PlanMonth } from "@/lib/plan/month";
import { initialPlanned, planTotals, plannedQty, toPlanLines, type Planned } from "@/lib/plan/totals";
import type { RationItemId } from "@/lib/ration/catalog";
import type { Suggestion } from "@/lib/ration/consumption";

type PlanEditorProps = {
  planMonth: PlanMonth;
  suggestions: Suggestion[];
  saved: PlanWithLines | null;
  /** This month already has a pickup, so the pantry check-in is available. */
  checkinReady: boolean;
  onSaved: () => void;
};

const at = (i: number) => ({ "--i": i }) as CSSProperties;

/** The editable plan: month chip, learning banner, one stepper per item, sticky totals. */
export function PlanEditor({ planMonth, suggestions, saved, checkinReady, onSaved }: PlanEditorProps) {
  const { mutate } = useData();
  const [planned, setPlanned] = useState<Planned>(() => initialPlanned(suggestions, saved));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const totals = useMemo(() => planTotals(suggestions, planned), [suggestions, planned]);
  const allLearning = suggestions.every((s) => s.learning);
  const setQty = (id: RationItemId, qty: number) => setPlanned((p) => ({ ...p, [id]: qty }));

  /** Resolves true once the plan is stored, false when the store refused. */
  const save = async (): Promise<boolean> => {
    if (saving) return false;
    setSaving(true);
    setError(false);
    try {
      await mutate((s) => s.savePlan(planMonth.month, toPlanLines(suggestions, planned)));
      onSaved();
      return true;
    } catch {
      setError(true);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stagger flex flex-col gap-3">
      <PlanMonthChip planMonth={planMonth} style={at(0)} />
      {allLearning ? <PlanLearningBanner checkinReady={checkinReady} style={at(0.5)} /> : null}
      {suggestions.map((s, i) => (
        <PlanItemRow
          key={s.item.id}
          suggestion={s}
          value={plannedQty(planned, s)}
          onChange={(qty) => setQty(s.item.id, qty)}
          style={at(Math.min(i + 1, 7))}
        />
      ))}
      {/* Direct child of the flex column: a sticky element can only stick within its parent. */}
      <PlanSummaryBar
        style={at(Math.min(suggestions.length + 1, 8))}
        className="mt-1"
        totals={totals}
        saving={saving}
        error={error}
        onSave={save}
      />
    </div>
  );
}
