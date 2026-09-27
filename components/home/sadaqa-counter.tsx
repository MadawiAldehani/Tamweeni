"use client";

import { CountUp } from "@/components/common/count-up";
import type { Donation } from "@/lib/data/types";
import { formatKD, formatNumber } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import { sadaqaTotals } from "@/lib/ration/meals";

/** Running total of what the family has given. Terracotta lives here and nowhere else. */
export function SadaqaCounter({ donations }: { donations: Donation[] }) {
  const { t, locale } = useLanguage();
  const totals = sadaqaTotals(donations);
  const hasGiven = totals.count > 0;

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-warm/15 text-2xl"
      >
        🤲
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {t("pages.home.sadaqa.title")}
        </p>
        <p className="tabular text-2xl font-semibold leading-tight">
          <bdi>
            <CountUp
              value={totals.kg}
              format={(n) => `${formatNumber(n, locale, 0)} ${t("units.kg")}`}
              durationMs={900}
            />
          </bdi>
          {hasGiven ? (
            <span className="tabular ms-2 text-sm font-medium text-warm-ink">
              <bdi>{t("pages.home.sadaqa.meals", { meals: formatNumber(totals.meals, locale, 0) })}</bdi>
            </span>
          ) : null}
        </p>
        <p className="text-xs text-muted-foreground">
          {hasGiven ? (
            <bdi>{t("pages.home.sadaqa.subsidy", { kd: formatKD(totals.kd, locale) })}</bdi>
          ) : (
            t("pages.home.sadaqa.empty")
          )}
        </p>
      </div>
      {/* The cultural phrase, shown in Arabic in both locales. */}
      <span lang="ar" className="font-ar shrink-0 text-xs font-medium text-warm-ink">
        {t("pages.home.sadaqa.jariya")}
      </span>
    </div>
  );
}
