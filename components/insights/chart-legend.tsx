"use client";

import { cn } from "@/lib/utils";
import type { SeriesKey } from "@/components/insights/chart-theme";

export type LegendEntry = { key: SeriesKey; label: string };

const swatchClass: Record<SeriesKey, string> = {
  entitled: "bg-chart-3 ring-1 ring-inset ring-border",
  collected: "bg-chart-1",
  used: "bg-chart-2",
};

/** Small square swatch, matching the bar shape. Reusable inside tooltips and tables too. */
export function Swatch({ series, className }: { series: SeriesKey; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("inline-block size-2.5 shrink-0 rounded-[3px]", swatchClass[series], className)} />
  );
}

/** Legend row under a chart: always present for two or more series. Text wears text tokens, never the series color. */
export function ChartLegend({ entries }: { entries: LegendEntry[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 px-0.5 text-xs text-muted-foreground">
      {entries.map((entry) => (
        <li key={entry.key} className="flex items-center gap-1.5">
          <Swatch series={entry.key} />
          <span>{entry.label}</span>
        </li>
      ))}
    </ul>
  );
}
