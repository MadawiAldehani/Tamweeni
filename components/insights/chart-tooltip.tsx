"use client";

import { Swatch } from "@/components/insights/chart-legend";
import type { SeriesKey } from "@/components/insights/chart-theme";

export type TooltipRow = { key: SeriesKey; label: string; value: string | null };

type ChartTooltipProps = {
  title: string;
  rows: TooltipRow[];
  /** Shown instead of a value when a row has none (e.g. "No pantry check-in that month"). */
  missingText: string;
  dir: "ltr" | "rtl";
};

/** White card, ring-1, values lead and labels follow. Rendered inside Recharts' LTR wrapper, so it sets its own dir. */
export function ChartTooltip({ title, rows, missingText, dir }: ChartTooltipProps) {
  return (
    <div dir={dir} className="min-w-40 rounded-xl bg-card px-3 py-2.5 text-xs text-card-foreground shadow-md ring-1 ring-foreground/10">
      <p className="mb-1.5 font-medium text-muted-foreground">{title}</p>
      <ul className="flex flex-col gap-1">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Swatch series={row.key} />
              {row.label}
            </span>
            {row.value === null ? (
              <span className="text-end text-muted-foreground">{missingText}</span>
            ) : (
              <span className="tabular font-semibold text-foreground">
                <bdi>{row.value}</bdi>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
