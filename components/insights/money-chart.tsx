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
import { formatKD, formatNumber, monthLabel } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import { moneySummary, type MonthPoint } from "@/lib/insights/series";

type Row = { month: string; label: string; collected: number; used: number | null };

type MoneyChartProps = { points: MonthPoint[]; ready: boolean };

/** Subsidy value received vs used per month, with a three-month total line above. */
export function MoneyChart({ points, ready }: MoneyChartProps) {
  const { t, locale, dir } = useLanguage();
  const kd = (value: number) => formatKD(value, locale);
  // Bare whole numbers on the caps: the card description names the unit, and "KD 123" would collide
  // with its neighbour on a 24px bar. The tooltip and table keep the full KD format.
  const fmt = (value: unknown) => (typeof value === "number" ? formatNumber(value, locale, 0) : "");

  const rows = useMemo<Row[]>(
    () => points.map((p) => ({ month: p.month, label: monthLabel(p.month, locale, "short"), collected: p.collectedKD, used: p.usedKD })),
    [points, locale],
  );
  const totals = useMemo(() => moneySummary(points), [points]);

  const columns: SeriesColumn<Row>[] = [
    { key: "collected", label: t("pages.insights.money.received"), cell: (r) => kd(r.collected) },
    { key: "used", label: t("pages.insights.series.used"), cell: (r) => (r.used === null ? null : kd(r.used)) },
  ];

  const summary =
    totals.usedKD === null ? (
      <p className="text-sm text-muted-foreground">
        <bdi>{t("pages.insights.money.receivedOnly", { received: kd(totals.receivedKD) })}</bdi>
        {" · "}
        {t("pages.insights.money.noCheckin")}
      </p>
    ) : (
      <p className="tabular text-sm text-foreground">
        <bdi>
          {t("pages.insights.money.summary", {
            received: kd(totals.receivedKD),
            used: kd(totals.usedKD),
            unused: kd(totals.unusedKD),
          })}
        </bdi>
      </p>
    );

  return (
    <ChartFrame
      ready={ready}
      title={t("pages.insights.money.title")}
      description={t("pages.insights.money.description")}
      ariaLabel={t("pages.insights.money.aria")}
      summary={summary}
      legend={<ChartLegend entries={columns.map((c) => ({ key: c.key, label: c.label }))} />}
      table={<SeriesTable rows={rows} columns={columns} />}
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
                    rows={columns.map((c) => ({ key: c.key, label: c.label, value: c.cell(row) }))}
                  />
                );
              }}
            />
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
