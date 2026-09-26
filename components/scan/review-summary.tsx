"use client";

import type { CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { formatKD } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import type { ReviewTotals } from "@/lib/receipt/review";
import { cn } from "@/lib/utils";

type ReviewSummaryProps = {
  totals: ReviewTotals;
  savable: boolean;
  saving: boolean;
  error: boolean;
  /** Why Save is disabled, already translated; null when nothing blocks it. */
  hint?: string | null;
  style?: CSSProperties;
  className?: string;
  onSave: () => void;
};

/** Sticky bar above the pill nav: item count, subsidy value, and the Save button. */
export function ReviewSummary({ totals, savable, saving, error, hint = null, style, className, onSave }: ReviewSummaryProps) {
  const { t, locale } = useLanguage();

  return (
    <div
      style={style}
      className={cn(
        "sticky bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-20 -mx-1 flex flex-col gap-2 rounded-2xl bg-card p-3 shadow-[0_8px_30px_rgba(30,42,38,0.12)] ring-1 ring-foreground/10",
        className,
      )}
    >
      <p className="tabular text-center text-sm">
        <bdi>{t("pages.scan.review.summary", { count: totals.count, kd: formatKD(totals.subsidyKD, locale) })}</bdi>
      </p>
      <Button size="lg" className="pressable h-12 rounded-xl text-base" disabled={!savable || saving} onClick={onSave}>
        {saving ? t("pages.scan.review.saving") : t("pages.scan.review.save")}
      </Button>
      {hint ? (
        <p className="text-center text-xs text-warning">{hint}</p>
      ) : error ? (
        <p className="text-center text-xs text-destructive">{t("pages.scan.review.saveError")}</p>
      ) : null}
    </div>
  );
}
