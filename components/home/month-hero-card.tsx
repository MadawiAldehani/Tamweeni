"use client";

import { CountUp } from "@/components/common/count-up";
import { ProgressRing } from "@/components/common/progress-ring";
import { SaduPattern } from "@/components/common/sadu-pattern";
import { greetingFor } from "@/components/home/greeting";
import { hijriMonthLabel } from "@/lib/format";
import { currentMonth, daysLeftInMonth, formatKD, monthLabel } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";

type MonthHeroCardProps = {
  entitledKD: number;
  collectedKD: number;
  /** null before mount (avoids hydration mismatch); the ring and greeting fill in after. */
  now: Date | null;
  /** Fraction of the month elapsed, animated in by the page. */
  ringValue: number;
};

/** The family's month: calendar chip, greeting, the KD figure, and a sand ring of days left. */
export function MonthHeroCard({ entitledKD, collectedKD, now, ringValue }: MonthHeroCardProps) {
  const { t, locale } = useLanguage();
  const stillYoursKD = Math.max(0, entitledKD - collectedKD);
  const greeting = now ? greetingFor(now.getHours()) : null;
  const hijri = hijriMonthLabel(now ?? new Date(), locale);
  const daysLeft = now ? daysLeftInMonth(now) : null;
  const daysLabel =
    daysLeft === 0
      ? t("common.lastDayLabel")
      : daysLeft === 1
        ? t("common.oneDayLeftLabel")
        : t("common.daysLeftLabel");

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
          </bdi>
        </span>

        <p className="text-sm text-white/85">
          {greeting ? (
            <span aria-hidden="true" className="me-1.5">
              {greeting.emoji}
            </span>
          ) : null}
          {t(greeting?.key ?? "pages.home.greeting.morning")}
        </p>

        <div className="flex items-end justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/70">
              {t("pages.home.hero.entitled")}
            </p>
            <bdi>
              <CountUp
                value={entitledKD}
                format={(n) => formatKD(n, locale)}
                durationMs={900}
                className="tabular block text-[2.5rem] font-semibold leading-none tracking-tight"
              />
            </bdi>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/75">
              <span>
                {t("pages.home.hero.collected")}{" "}
                <bdi className="font-medium text-white">{formatKD(collectedKD, locale)}</bdi>
              </span>
              <span>
                {t("pages.home.hero.stillYours")}{" "}
                <bdi className="font-medium text-secondary">{formatKD(stillYoursKD, locale)}</bdi>
              </span>
            </div>
          </div>

          <ProgressRing
            value={ringValue}
            size={96}
            strokeWidth={8}
            trackClassName="text-white/20"
            progressClassName="text-secondary"
            label={t("common.monthProgress")}
          >
            <span className="tabular text-2xl font-semibold leading-none">{daysLeft ?? "—"}</span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.06em] text-white/75">
              {daysLabel}
            </span>
          </ProgressRing>
        </div>
      </div>
    </section>
  );
}
