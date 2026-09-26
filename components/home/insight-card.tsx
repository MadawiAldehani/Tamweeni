"use client";

import type { Snapshot } from "@/lib/data/types";
import { useLanguage } from "@/lib/i18n/provider";
import { homeInsight } from "@/lib/ration/insights";

/**
 * One friendly sentence about the family's month, from lib/ration/insights.
 * Voice rules: never "waste"/"هدر" toward the family; say "still yours",
 * "could feed", "set aside"; Kuwaiti-register plural verbs in Arabic (شوفوا/خذوا/صوّروا).
 */
export function InsightCard({ snapshot, now }: { snapshot: Snapshot; now: Date | null }) {
  const { t, locale } = useLanguage();
  const hasData = snapshot.pickups.length > 0;
  const text = now ? homeInsight(snapshot, now, locale, t) : t("pages.home.insight.noData");

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-secondary/50 px-4 py-3">
      <span aria-hidden="true" className="text-xl leading-none">
        {hasData ? "💡" : "👋"}
      </span>
      <p className="text-sm leading-snug text-foreground">{text}</p>
    </div>
  );
}
