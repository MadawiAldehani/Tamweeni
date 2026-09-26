"use client";

import type { CSSProperties } from "react";

import { formatNumber } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";

/** Short celebratory header shown above the voucher: the sadaqa circle, thanks, and the meals passed on. */
export function PledgeSuccess({ meals, style }: { meals: number; style?: CSSProperties }) {
  const { t, locale } = useLanguage();

  return (
    <div style={style} className="flex flex-col items-center gap-2 py-2 text-center">
      {/* Terracotta is reserved for giving: the sadaqa circle. */}
      <span
        aria-hidden="true"
        className="flex size-16 select-none items-center justify-center rounded-full bg-warm/15 text-3xl leading-none animate-in zoom-in-50 fade-in duration-500 fill-mode-both"
      >
        🤲
      </span>
      <h2 className="text-xl font-semibold">{t("pages.donate.success.title")}</h2>
      <p className="tabular text-sm text-muted-foreground">
        <bdi>{t("pages.donate.success.meals", { meals: formatNumber(meals, locale, 0) })}</bdi>
      </p>
    </div>
  );
}
