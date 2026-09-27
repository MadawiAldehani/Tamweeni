"use client";

import type { CSSProperties } from "react";

import { SaduPattern } from "@/components/common/sadu-pattern";
import { SourceBadge } from "@/components/impact/source-badge";
import { currentMonth, monthLabel } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import type { ImpactStats } from "@/lib/impact/types";

/** Eyebrow, the claim as a headline, a short Sadu rule, and the lede. Two stagger children. */
export function ImpactHero({ stats }: { stats: ImpactStats | null }) {
  const { t, locale } = useLanguage();
  // "Aggregated and anonymised" is only true of live data; the projection says so up front,
  // and so does the loading state, so the page never briefly over-claims.
  const eyebrowKey = stats?.source === "live" ? "pages.impact.eyebrow" : "pages.impact.eyebrowProjection";

  return (
    <>
      <p
        style={{ "--i": 0 } as CSSProperties}
        className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground"
      >
        <bdi>{t(eyebrowKey, { month: monthLabel(currentMonth(), locale) })}</bdi>
      </p>

      <div style={{ "--i": 1 } as CSSProperties} className="flex flex-col gap-4">
        <h1 className="max-w-[22ch] text-[2rem] font-semibold leading-[1.15] tracking-tight sm:text-[2.75rem]">
          {t("pages.impact.headline")}
        </h1>
        {stats ? (
          <div className="self-start">
            <SourceBadge stats={stats} />
          </div>
        ) : null}
        <SaduPattern variant="band" className="h-3 w-36 self-start text-primary/70" />
        <p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground">
          {t("pages.impact.lede")}
        </p>
      </div>
    </>
  );
}
