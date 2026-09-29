"use client";

import { HeartHandshake } from "lucide-react";
import type { CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import type { DraftTotals } from "@/lib/donate/prefill";
import { formatKD, formatNumber } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type DonateSummaryBarProps = {
  totals: DraftTotals;
  pledging: boolean;
  error: boolean;
  style?: CSSProperties;
  className?: string;
  onPledge: () => void;
};

/** Sticky bar above the pill nav: kilos, subsidy and meals of the leftovers picked, and the warm "Give to the Food Bank" button. */
export function DonateSummaryBar({ totals, pledging, error, style, className, onPledge }: DonateSummaryBarProps) {
  const { t, locale } = useLanguage();
  const empty = totals.count === 0;

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
          {t("pages.donate.summary.totals", {
            kg: formatNumber(totals.kg, locale, 1),
            kd: formatKD(totals.kd, locale),
            meals: formatNumber(totals.meals, locale, 0),
          })}
        </bdi>
      </p>
      {/* Terracotta is reserved for giving: this is the one primary action that wears it. */}
      <Button
        size="lg"
        className="pressable h-12 rounded-xl bg-warm-ink text-base text-white hover:bg-warm-ink/90"
        disabled={empty || pledging}
        onClick={onPledge}
      >
        <HeartHandshake aria-hidden="true" />
        {pledging ? t("pages.donate.summary.pledging") : t("pages.donate.summary.pledge")}
      </Button>
      {empty ? (
        <p className="text-center text-xs text-muted-foreground">{t("pages.donate.summary.hint")}</p>
      ) : error ? (
        <p className="text-center text-xs text-destructive">{t("pages.donate.summary.error")}</p>
      ) : null}
    </div>
  );
}
