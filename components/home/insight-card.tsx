"use client";

import { useT } from "@/lib/i18n/provider";

/**
 * One friendly sentence about the family's month. Phase 1 always shows the empty state.
 * Voice rules for future sentences: never "waste"/"هدر" toward the family; say "still yours",
 * "could feed", "set aside"; Kuwaiti-register plural verbs in Arabic (شوفوا/خذوا/صوّروا).
 */
export function InsightCard() {
  const t = useT();

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-secondary/50 px-4 py-3">
      <span aria-hidden="true" className="text-xl leading-none">
        👋
      </span>
      <p className="text-sm leading-snug text-foreground">{t("pages.home.insight.empty")}</p>
    </div>
  );
}
