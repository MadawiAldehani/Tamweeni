"use client";

import { Swatch } from "@/components/insights/chart-legend";
import type { SeriesKey } from "@/components/insights/chart-theme";
import { useT } from "@/lib/i18n/provider";

export type SeriesColumn<Row> = {
  key: SeriesKey;
  label: string;
  /** Formatted value, or null when the row has no data for this series. */
  cell: (row: Row) => string | null;
};

type SeriesTableProps<Row extends { month: string; label: string }> = {
  rows: Row[];
  columns: SeriesColumn<Row>[];
  /** Shown once in the header so cells stay short. */
  unit?: string;
};

/** The chart's twin: month × series as a plain table with the same numbers. */
export function SeriesTable<Row extends { month: string; label: string }>({ rows, columns, unit }: SeriesTableProps<Row>) {
  const t = useT();

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-border text-xs text-muted-foreground">
          <th scope="col" className="py-2 pe-2 text-start font-medium">{t("pages.insights.table.month")}</th>
          {columns.map((c) => (
            <th key={c.key} scope="col" className="py-2 ps-2 text-end font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Swatch series={c.key} />
                {c.label}
                {unit ? <span className="text-muted-foreground/70">({unit})</span> : null}
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.month} className="border-b border-border/60 last:border-0">
            <th scope="row" className="py-2.5 pe-2 text-start font-medium text-foreground">{row.label}</th>
            {columns.map((c) => {
              const value = c.cell(row);
              return (
                <td key={c.key} className="tabular py-2.5 ps-2 text-end">
                  {value === null ? <span className="text-muted-foreground">{t("pages.insights.table.noData")}</span> : <bdi>{value}</bdi>}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
