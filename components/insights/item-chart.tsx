"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartFrame } from "@/components/insights/chart-frame";
import { ChartLegend } from "@/components/insights/chart-legend";
import { ChartTooltip } from "@/components/insights/chart-tooltip";
import {
  AXIS_TICK, BAR_CATEGORY_GAP, BAR_GAP, BAR_MAX, BAR_RADIUS, CHART_HEIGHT, CURSOR_FILL, SERIES_FILL, VALUE_LABEL,
} from "@/components/insights/chart-theme";
import { SeriesTable, type SeriesColumn } from "@/components/insights/series-table";
import { formatNumber, monthLabel } from "@/lib/format";
import { localized, useLanguage } from "@/lib/i18n/provider";
import type { MonthPoint } from "@/lib/insights/series";
import { unitFor } from "@/lib/plan/units";
import type { RationItem } from "@/lib/ration/catalog";

type Row = { month: string; label: string; entitled: number; collected: number; used: number | null };

type ItemChartProps = { points: MonthPoint[]; item: RationItem; ready: boolean };

/** One item over the last months: neutral entitlement track, collected (green) and used (terracotta) bars. */
export function ItemChart({ points, item, ready }: ItemChartProps) {
  const { t, locale, dir } = useLanguage();
  const name = localized(item, "name", locale);
  // Axis/table unit is generic, so a qty ≠ 1 keeps "cans" plural.
  const unit = unitFor(item.unit, 2, t);
  const n = (value: number) => formatNumber(value, locale, 1);
  const fmt = (value: unknown) => (typeof value === "number" ? n(value) : "");

  const rows = useMemo<Row[]>(
    () => points.map((p) => ({ month: p.month, label: monthLabel(p.month, locale, "short"), ...p.items[item.id] })),
    [points, item.id, locale],
  );

  const columns: SeriesColumn<Row>[] = [
    { key: "entitled", label: t("pages.insights.series.entitled"), cell: (r) => n(r.entitled) },
    { key: "collected", label: t("pages.insights.series.collected"), cell: (r) => n(r.collected) },
    { key: "used", label: t("pages.insights.series.used"), cell: (r) => (r.used === null ? null : n(r.used)) },
  ];

  return (
    <ChartFrame
      ready={ready}
      title={t("pages.insights.itemChart.title", { item: name })}
      description={t("pages.insights.itemChart.description", { unit })}
      ariaLabel={t("pages.insights.itemChart.aria", { item: name })}
      legend={<ChartLegend entries={columns.map((c) => ({ key: c.key, label: c.label }))} />}
      table={<SeriesTable rows={rows} columns={columns} unit={unit} />}
      chart={
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={rows} barGap={BAR_GAP} barCategoryGap={BAR_CATEGORY_GAP} margin={{ top: 18, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} />
            <YAxis width={28} tickCount={3} tickLine={false} axisLine={false} tick={AXIS_TICK} />
            <Tooltip
              cursor={CURSOR_FILL}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as Row | undefined;
                if (!active || !row) return null;
                return (
                  <ChartTooltip
                    dir={dir}
                    title={monthLabel(row.month, locale, "long")}
                    missingText={t("pages.insights.noCheckin")}
                    rows={columns.map((c) => {
                      const value = c.cell(row);
                      return { key: c.key, label: c.label, value: value === null ? null : `${value} ${unit}` };
                    })}
                  />
                );
              }}
            />
            <Bar dataKey="entitled" fill={SERIES_FILL.entitled} stroke="var(--border)" strokeWidth={1} radius={BAR_RADIUS} maxBarSize={BAR_MAX} isAnimationActive={false} />
            <Bar dataKey="collected" fill={SERIES_FILL.collected} radius={BAR_RADIUS} maxBarSize={BAR_MAX}>
              <LabelList dataKey="collected" position="top" formatter={fmt} {...VALUE_LABEL} />
            </Bar>
            <Bar dataKey="used" fill={SERIES_FILL.used} radius={BAR_RADIUS} maxBarSize={BAR_MAX}>
              <LabelList dataKey="used" position="top" formatter={fmt} {...VALUE_LABEL} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      }
    />
  );
}
