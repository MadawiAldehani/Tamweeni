"use client";

import { BigStat } from "@/components/impact/big-stat";
import { buildStats } from "@/components/impact/impact-data";
import { useLanguage } from "@/lib/i18n/provider";

/** The four national numbers as a ledger: one row each, a quiet caption row underneath. */
export function ImpactLedger() {
  const { t, locale } = useLanguage();
  const stats = buildStats(locale);

  return (
    <section
      aria-labelledby="impact-stats"
      className="overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/10"
    >
      <h2 id="impact-stats" className="sr-only">
        {t("pages.impact.statsTitle")}
      </h2>

      <ul className="divide-y divide-border">
        {stats.map((stat) => (
          <BigStat
            key={stat.key}
            stat={stat}
            label={t(`pages.impact.stats.${stat.key}`)}
            bar={stat.key === "overCollection"}
          />
        ))}
      </ul>

      {/* A static dot: no "live / updated 2 min ago" claim while the numbers are placeholders. */}
      <div className="flex items-center gap-2 bg-muted/60 px-5 py-3 text-xs text-muted-foreground sm:px-8">
        <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-primary" />
        {t("pages.impact.statsCaption")}
      </div>
    </section>
  );
}
