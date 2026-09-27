"use client";

import { BigStat } from "@/components/impact/big-stat";
import { buildStats } from "@/components/impact/impact-data";
import { SourceBadge } from "@/components/impact/source-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n/provider";
import type { ImpactStats } from "@/lib/impact/types";

const ROWS = 4;

/** The four national numbers as a ledger: one row each, the data source and its caveat underneath. */
export function ImpactLedger({ stats }: { stats: ImpactStats | null }) {
  const { t, locale } = useLanguage();

  return (
    <section
      aria-labelledby="impact-stats"
      aria-busy={stats === null}
      className="overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/10"
    >
      <h2 id="impact-stats" className="sr-only">
        {t("pages.impact.statsTitle")}
      </h2>

      {stats === null ? (
        <ul className="divide-y divide-border">
          {Array.from({ length: ROWS }, (_, i) => (
            <li key={i} className="flex items-center gap-5 px-5 py-6 sm:px-8">
              <Skeleton className="h-10 w-28 rounded-lg" />
              <Skeleton className="h-4 w-40 rounded" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="divide-y divide-border">
          {buildStats(stats, locale, t).map((stat) => (
            <BigStat
              key={stat.key}
              stat={stat}
              label={t(`pages.impact.stats.${stat.key}`)}
              bar={stat.key === "overCollection"}
            />
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 bg-muted/60 px-5 py-3 text-xs text-muted-foreground sm:px-8">
        {stats === null ? (
          <Skeleton className="h-6 w-44 rounded-full" />
        ) : (
          <>
            <SourceBadge stats={stats} />
            <p className="leading-relaxed">
              {stats.source === "live" ? t("pages.impact.statsCaption") : t("pages.impact.source.note")}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
