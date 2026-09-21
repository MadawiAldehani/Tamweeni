"use client";

import { useEffect, useState } from "react";

import { CountUp } from "@/components/common/count-up";
import { useT } from "@/lib/i18n/provider";
import type { Stat } from "@/components/impact/impact-data";

type BigStatProps = {
  stat: Stat;
  label: string;
  /** Draw a thin bar under the label (percent stats); fills after paint. */
  bar?: boolean;
};

/** One ledger row: a big number (or an em dash while awaiting data) beside its label. */
export function BigStat({ stat, label, bar = false }: BigStatProps) {
  const t = useT();
  const [mounted, setMounted] = useState(false);
  const { value, format } = stat;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <li className="grid grid-cols-[minmax(7.5rem,auto)_1fr] items-baseline gap-x-5 gap-y-1 px-5 py-5 sm:grid-cols-[minmax(11rem,auto)_1fr] sm:px-8 sm:py-6">
      {value === null ? (
        <span
          aria-label={t("pages.impact.awaiting")}
          className="tabular text-4xl font-semibold leading-none text-muted-foreground/50 sm:text-5xl"
        >
          —
        </span>
      ) : (
        <CountUp
          value={value}
          format={format}
          durationMs={900}
          className="tabular text-4xl font-semibold leading-none text-primary sm:text-5xl"
        />
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {value === null ? (
          <span className="text-xs text-muted-foreground">{t("pages.impact.awaiting")}</span>
        ) : null}
        {bar && value !== null ? (
          <div className="h-1 w-full max-w-[16rem] overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-[900ms] ease-out"
              style={{ width: mounted ? `${value}%` : "0%" }}
            />
          </div>
        ) : null}
      </div>
    </li>
  );
}
