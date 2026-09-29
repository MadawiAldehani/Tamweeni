"use client";

import { History } from "lucide-react";
import { useMemo } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { SeriesTable, type SeriesColumn } from "@/components/insights/series-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Snapshot } from "@/lib/data/types";
import { formatNumber, monthLabel } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import { householdHistory, type HouseholdMonthHistory } from "@/lib/insights/history";

type Row = HouseholdMonthHistory & { label: string };

type PastMonthsCardProps = { snapshot: Snapshot; now: Date };

const MONTHS = 3;

/**
 * Past months side by side — collected, used, left over, wasted, given — in kilos and litres, so a
 * family can see what it actually needed. Months without a check-in show "—" for the three figures
 * that need one; gifts are pledges and show regardless. Leftovers are net of what was given away.
 */
export function PastMonthsCard({ snapshot, now }: PastMonthsCardProps) {
  const { t, locale } = useLanguage();
  const rows = useMemo<Row[]>(
    () => householdHistory(snapshot, now, MONTHS).map((row) => ({ ...row, label: monthLabel(row.month, locale, "short") })),
    [snapshot, now, locale],
  );
  const qty = (n: number | null) => (n === null ? null : formatNumber(n, locale, 1));

  const columns: SeriesColumn<Row>[] = [
    { key: "collected", series: "collected", label: t("pages.insights.series.collected"), cell: (r) => qty(r.collectedKg) },
    { key: "used", series: "used", label: t("pages.insights.series.used"), cell: (r) => qty(r.usedKg) },
    { key: "leftover", label: t("pages.insights.past.leftover"), cell: (r) => qty(r.leftoverKg) },
    { key: "wasted", label: t("pages.insights.series.wasted"), cell: (r) => qty(r.wastedKg) },
    { key: "donated", label: t("pages.insights.series.donated"), cell: (r) => qty(r.donatedKg) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pages.insights.past.title")}</CardTitle>
        <CardDescription>{t("pages.insights.past.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState icon={History} title={t("pages.insights.past.empty")} className="py-4" />
        ) : (
          <div className="overflow-x-auto">
            <SeriesTable rows={rows} columns={columns} unit={t("units.kg")} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
