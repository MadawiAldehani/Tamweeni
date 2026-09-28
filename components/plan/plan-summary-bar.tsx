"use client";

import type { CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import { formatSurplus, type PlanTotals } from "@/lib/plan/totals";
import { cn } from "@/lib/utils";

type PlanSummaryBarProps = {
  totals: PlanTotals;
  saving: boolean;
  error: boolean;
  style?: CSSProperties;
  className?: string;
  onSave: () => void;
};

/** Sticky bar above the pill nav: what the family needs vs. its surplus (kilos only), and Save plan. */
export function PlanSummaryBar({ totals, saving, error, style, className, onSave }: PlanSummaryBarProps) {
  const { t, locale } = useLanguage();

  return (
    <div
      style={style}
      className={cn(
        "sticky bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-20 -mx-1 flex flex-col gap-2 rounded-2xl bg-card p-3 shadow-[0_8px_30px_rgba(30,42,38,0.12)] ring-1 ring-foreground/10",
        className,
      )}
    >
      <div className="flex flex-col gap-0.5 text-center">
        <p className="tabular text-sm font-medium">
          <bdi>
            {totals.takingEverything
              ? t("pages.plan.summary.takingAll")
              : t("pages.plan.summary.needSurplus", {
                  need: formatNumber(totals.needKg, locale, 1),
                  surplus: formatSurplus(totals, locale, t),
                })}
          </bdi>
        </p>
        <p className="text-xs text-muted-foreground">{t("pages.plan.summary.surplusHint")}</p>
      </div>
      <Button size="lg" className="pressable h-12 rounded-xl text-base" disabled={saving} onClick={onSave}>
        {saving ? t("pages.plan.summary.saving") : t("pages.plan.summary.save")}
      </Button>
      {error ? <p className="text-center text-xs text-destructive">{t("pages.plan.summary.saveError")}</p> : null}
    </div>
  );
}
