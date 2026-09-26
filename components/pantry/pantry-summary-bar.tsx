"use client";

import type { CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type PantrySummaryBarProps = {
  count: number;
  usedKg: number;
  saving: boolean;
  error: boolean;
  style?: CSSProperties;
  className?: string;
  onSave: () => void;
};

/** Sticky bar above the pill nav: item count, rough kilos used, and the Save button. */
export function PantrySummaryBar({ count, usedKg, saving, error, style, className, onSave }: PantrySummaryBarProps) {
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
        <bdi>{t("pages.pantry.summary", { count, kg: formatNumber(usedKg, locale, 1) })}</bdi>
      </p>
      <Button size="lg" className="pressable h-12 rounded-xl text-base" disabled={saving} onClick={onSave}>
        {saving ? t("pages.pantry.saving") : t("pages.pantry.save")}
      </Button>
      {error ? <p className="text-center text-xs text-destructive">{t("pages.pantry.saveError")}</p> : null}
    </div>
  );
}
