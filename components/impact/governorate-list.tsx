"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { buildGovernorates, type GovernorateRow } from "@/components/impact/impact-data";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import type { ImpactStats } from "@/lib/impact/types";
import { cn } from "@/lib/utils";

const HEIGHT = 220;
/** Single hue, stepping lighter by rank (sequential): darkest = highest rate. */
const opacityFor = (rank: number) => Math.max(0.35, 1 - rank * 0.13);
const pctText = (pct: number, locale: "en" | "ar") => `${formatNumber(pct, locale, 0)}%`;

type TooltipPayload = { active?: boolean; payload?: ReadonlyArray<{ payload?: GovernorateRow }> };

function GovernorateTooltip({ active, payload }: TooltipPayload) {
  const { t, locale, dir } = useLanguage();
  const row = payload?.[0]?.payload;
  if (!active || !row || row.pct === null) return null;
  return (
    <div dir={dir} className="rounded-xl bg-card px-3 py-2 text-xs shadow-sm ring-1 ring-foreground/10">
      <p className="font-medium text-foreground">{row.name}</p>
      <p className="tabular text-foreground">
        <span className="font-semibold">{pctText(row.pct, locale)}</span>{" "}
        <span className="text-muted-foreground">{t("pages.impact.governorate.colRate")}</span>
      </p>
      <p className="tabular text-muted-foreground">
        <bdi>{t("pages.impact.governorate.households", { count: formatNumber(row.households, locale, 0) })}</bdi>
      </p>
    </div>
  );
}

function GovernorateChart({ rows }: { rows: GovernorateRow[] }) {
  const { t, locale } = useLanguage();
  const max = Math.max(1, ...rows.map((r) => r.pct ?? 0));
  return (
    <div dir="ltr" role="img" aria-label={t("pages.impact.governorate.chartLabel")} style={{ height: HEIGHT }}>
      <ResponsiveContainer width="100%" height={HEIGHT}>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 0 }} barCategoryGap={6}>
          <XAxis type="number" hide domain={[0, Math.ceil(max * 1.15)]} />
          <YAxis
            type="category"
            dataKey="name"
            width={96}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fontFamily: "inherit", fill: "var(--muted-foreground)" }}
          />
          <Tooltip cursor={{ fill: "var(--muted)", fillOpacity: 0.6 }} content={<GovernorateTooltip />} />
          <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive>
            {rows.map((row, i) => (
              <Cell key={row.id} fill="var(--chart-1)" fillOpacity={opacityFor(i)} />
            ))}
            <LabelList
              dataKey="pct"
              position="right"
              offset={8}
              fill="var(--foreground)"
              fontSize={12}
              fontFamily="inherit"
              formatter={(value) => pctText(Number(value), locale)}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function GovernorateTable({ rows }: { rows: GovernorateRow[] }) {
  const { t, locale } = useLanguage();
  const th = "py-2 text-xs font-medium text-muted-foreground";
  return (
    <table className="w-full text-sm">
      <thead className="border-b border-border text-start">
        <tr>
          <th scope="col" className={cn(th, "text-start")}>{t("pages.impact.governorate.colGovernorate")}</th>
          <th scope="col" className={cn(th, "text-end")}>{t("pages.impact.governorate.colRate")}</th>
          <th scope="col" className={cn(th, "text-end")}>{t("pages.impact.governorate.colHouseholds")}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map((row) => (
          <tr key={row.id}>
            <th scope="row" className="py-2.5 text-start font-medium">{row.name}</th>
            <td className="tabular py-2.5 text-end">
              {row.pct === null ? <span className="text-muted-foreground">{t("pages.impact.governorate.awaitingCell")}</span> : pctText(row.pct, locale)}
            </td>
            <td className="tabular py-2.5 text-end">{formatNumber(row.households, locale, 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Over-collection per governorate: a single-hue horizontal bar chart with a table twin. */
export function GovernorateList({ stats }: { stats: ImpactStats | null }) {
  const { t, locale } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<"chart" | "table">("chart");
  useEffect(() => setMounted(true), []);

  const rows = stats ? buildGovernorates(stats, locale) : [];
  const charted = rows.filter((r) => r.pct !== null);
  const awaiting = rows.filter((r) => r.pct === null);
  const ready = mounted && stats !== null;
  const tab = (key: "chart" | "table", label: string) => (
    <button
      type="button"
      aria-pressed={view === key}
      onClick={() => setView(key)}
      className={cn(
        "pressable min-h-11 rounded-full px-4 text-sm font-medium transition-colors",
        view === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
      )}
    >
      {label}
    </button>
  );

  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("pages.impact.governorate.title")}</h2>
        <div role="group" aria-label={t("pages.impact.governorate.viewLabel")} className="flex rounded-full bg-muted p-1">
          {tab("chart", t("pages.impact.governorate.chartView"))}
          {tab("table", t("pages.impact.governorate.tableView"))}
        </div>
      </div>

      {!ready ? (
        <Skeleton className="w-full rounded-2xl" style={{ height: HEIGHT }} />
      ) : view === "table" ? (
        <GovernorateTable rows={rows} />
      ) : charted.length > 0 ? (
        <GovernorateChart rows={charted} />
      ) : null}

      {ready && view === "chart" && awaiting.length > 0 ? (
        <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
          {awaiting.map((row) => (
            <li key={row.id} className="flex items-center gap-2">
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-chart-3 ring-1 ring-border" />
              <bdi>{t("pages.impact.governorate.awaitingRow", { name: row.name })}</bdi>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-xs text-muted-foreground">{t("pages.impact.governorate.caption")}</p>
    </section>
  );
}
