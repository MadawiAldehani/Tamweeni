"use client";

import { CountUp } from "@/components/common/count-up";
import { ProgressRing } from "@/components/common/progress-ring";
import { SaduPattern } from "@/components/common/sadu-pattern";
import { greetingFor } from "@/components/home/greeting";
import type { Household } from "@/lib/data/types";
import { currentMonth, daysLeftInMonth, formatKDWhole, formatNumber, hijriMonthLabel, monthLabel } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import { quantityTotals, type MonthSummary } from "@/lib/ration/entitlement";

type MonthHeroCardProps = {
  summary: MonthSummary;
  /** null before mount (avoids hydration mismatch); the greeting and days-left fill in after. */
  now: Date | null;
  household: Household | null;
  /** Collected share of the entitlement, animated in by the page. */
  ringValue: number;
};

/** The family's month: calendar chip, greeting, the KD figure, and a sand ring of the share collected. */
export function MonthHeroCard({ summary, now, household, ringValue }: MonthHeroCardProps) {
  const { t, locale } = useLanguage();
  const greeting = now ? greetingFor(now.getHours()) : null;
  const hijri = hijriMonthLabel(now ?? new Date(), locale);
  const daysLeft = now ? daysLeftInMonth(now) : null;
  const daysChip =
    daysLeft === null
      ? ""
      : daysLeft === 0
        ? t("common.lastDay")
        : daysLeft === 1
          ? t("common.oneDayLeft")
          : daysLeft === 2
            ? t("common.twoDaysLeft")
            : t(daysLeft <= 10 ? "common.daysLeftFew" : "common.daysLeft", { count: daysLeft });
  const greetingText = t(greeting?.key ?? "pages.home.greeting.morning");
  const qty = quantityTotals(summary.items);
  const kg = (n: number) => `${formatNumber(n, locale, 1)} ${t("units.kg")}`;
  const pct = Math.min(100, Math.round((qty.entitledKg ? qty.collectedKg / qty.entitledKg : 0) * 100));

  return (
    <section className="bg-hero relative overflow-hidden rounded-2xl text-primary-foreground shadow-[0_16px_40px_-20px_rgba(31,111,74,0.55)]">
      <SaduPattern variant="field" className="pointer-events-none absolute inset-0 text-white/8" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -end-16 size-56 rounded-full bg-[radial-gradient(closest-side,rgba(232,217,191,0.22),transparent)]"
      />

      <div className="relative flex flex-col gap-4 p-5">
        <span className="inline-flex w-fit items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium tabular">
          <bdi>
            {monthLabel(currentMonth(now ?? undefined), locale)}
            {hijri ? ` · ${hijri}` : ""}
            {daysChip ? ` · ${daysChip}` : ""}
          </bdi>
        </span>

        <p className="text-sm text-white/85">
          {greeting ? (
            <span aria-hidden="true" className="me-1.5">
              {greeting.emoji}
            </span>
          ) : null}
          {household?.name
            ? t("pages.home.greeting.named", { greeting: greetingText, name: household.name })
            : greetingText}
        </p>

        <div className="flex items-end justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/85">
              {t("pages.home.hero.entitled")}
            </p>
            <bdi>
              <CountUp
                value={qty.entitledKg}
                format={kg}
                durationMs={900}
                className="tabular block whitespace-nowrap text-[2.5rem] font-semibold leading-none tracking-tight"
              />
            </bdi>
            {qty.entitledCans > 0 ? (
              <bdi className="tabular text-sm text-white/85">{t("pages.home.hero.plusCans", { count: formatNumber(qty.entitledCans, locale, 0) })}</bdi>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/85">
              <span>
                {t("pages.home.hero.collected")}{" "}
                <bdi className="font-medium text-white">{kg(qty.collectedKg)}</bdi>
              </span>
              <span>
                {t("pages.home.hero.stillYours")}{" "}
                <bdi className="font-medium text-secondary">{kg(qty.remainingKg)}</bdi>
              </span>
            </div>
            <p className="mt-1 text-xs text-white/75">
              <bdi>{t("pages.home.hero.worth", { kd: formatKDWhole(summary.entitledKD, locale) })}</bdi>
            </p>
          </div>

          <ProgressRing
            value={ringValue}
            size={96}
            strokeWidth={8}
            trackClassName="text-white/20"
            progressClassName="text-secondary"
            label={t("pages.home.hero.collectedShare")}
          >
            <span className="tabular text-2xl font-semibold leading-none">
              <bdi>{pct}%</bdi>
            </span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.06em] text-white/85">
              {t("pages.home.hero.collectedLabel")}
            </span>
          </ProgressRing>
        </div>
      </div>
    </section>
  );
}
