"use client";

import { HeartHandshake } from "lucide-react";
import type { CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { formatKD, formatNumber } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import type { PlanTotals } from "@/lib/plan/totals";
import { cn } from "@/lib/utils";

type PlanSummaryBarProps = {
  totals: PlanTotals;
  saving: boolean;
  error: boolean;
  style?: CSSProperties;
  className?: string;
  onSave: () => void;
  /** Saves the plan, then opens the donate page. */
  onDonate: () => void;
};

/** Sticky bar above the pill nav: what is left behind, Donate it (when there is something), Save plan. */
export function PlanSummaryBar({ totals, saving, error, style, className, onSave, onDonate }: PlanSummaryBarProps) {
  const { t, locale } = useLanguage();
  const canDonate = totals.leavingKD > 0;

  return (
    <div
      style={style}
      className={cn(
        "sticky bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-20 -mx-1 flex flex-col gap-2 rounded-2xl bg-card p-3 shadow-[0_8px_30px_rgba(30,42,38,0.12)] ring-1 ring-foreground/10",
        className,
      )}
    >
      <p className="tabular text-center text-sm">
        <bdi>
          {totals.takingEverything
            ? t("pages.plan.summary.takingAll")
            : t("pages.plan.summary.leaving", {
                kg: formatNumber(totals.leavingKg, locale, 1),
                kd: formatKD(totals.leavingKD, locale),
              })}
        </bdi>
      </p>
      <div className="flex gap-2">
        {canDonate ? (
          <Button
            size="lg"
            className="pressable h-12 flex-1 rounded-xl bg-warm/15 text-base text-warm-ink hover:bg-warm/25"
            variant="secondary"
            disabled={saving}
            onClick={onDonate}
          >
            <HeartHandshake aria-hidden="true" />
            {t("pages.plan.summary.donate")}
          </Button>
        ) : null}
        <Button size="lg" className="pressable h-12 flex-1 rounded-xl text-base" disabled={saving} onClick={onSave}>
          {saving ? t("pages.plan.summary.saving") : t("pages.plan.summary.save")}
        </Button>
      </div>
      {error ? <p className="text-center text-xs text-destructive">{t("pages.plan.summary.saveError")}</p> : null}
    </div>
  );
}
