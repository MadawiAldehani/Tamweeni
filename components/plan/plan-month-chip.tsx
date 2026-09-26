"use client";

import { CalendarDays } from "lucide-react";
import type { CSSProperties } from "react";

import { monthLabel } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import type { PlanMonth } from "@/lib/plan/month";

/** "Planning {month}" chip with a one-line reason for the month chosen. */
export function PlanMonthChip({ planMonth, style }: { planMonth: PlanMonth; style?: CSSProperties }) {
  const { t, locale } = useLanguage();

  return (
    <div style={style} className="flex flex-col gap-1.5">
      <span className="tabular inline-flex w-fit items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
        <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
        <bdi>{t("pages.plan.month.planning", { month: monthLabel(planMonth.month, locale) })}</bdi>
      </span>
      <p className="text-xs text-muted-foreground">
        {t(planMonth.shifted ? "pages.plan.month.shifted" : "pages.plan.month.thisMonth")}
      </p>
    </div>
  );
}
