"use client";

import { CountUp } from "@/components/common/count-up";
import { formatNumber } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";

/** Running total of what the family has given. Terracotta lives here and nowhere else. */
export function SadaqaCounter({ donatedKg }: { donatedKg: number }) {
  const { t, locale } = useLanguage();

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
              value={donatedKg}
              format={(n) => `${formatNumber(n, locale, 0)} ${t("units.kg")}`}
              durationMs={900}
            />
          </bdi>
        </p>
        <p className="text-xs text-muted-foreground">
          {donatedKg > 0 ? t("pages.home.sadaqa.caption") : t("pages.home.sadaqa.empty")}
        </p>
      </div>
      {/* The cultural phrase, shown in Arabic in both locales. */}
      <span lang="ar" className="font-ar shrink-0 text-xs font-medium text-warm">
        {t("pages.home.sadaqa.jariya")}
      </span>
    </div>
  );
}
