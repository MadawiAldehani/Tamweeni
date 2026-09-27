"use client";

import { Table2, ChartColumn } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n/provider";
import { CHART_HEIGHT } from "@/components/insights/chart-theme";

type ChartFrameProps = {
  title: string;
  description?: string;
  /** Charts need window: until the page has mounted a Skeleton of the same height holds the space. */
  ready: boolean;
  /** Rendered above the chart (e.g. the money summary line). */
  summary?: ReactNode;
  chart: ReactNode;
  legend?: ReactNode;
  /** The same numbers as a plain table, for screen readers and anyone who prefers reading. */
  table: ReactNode;
  /** Announced on the chart region. */
  ariaLabel: string;
};

/** White card that hosts one chart, its legend and a chart ⇄ table toggle. */
export function ChartFrame({ title, description, ready, summary, chart, legend, table, ariaLabel }: ChartFrameProps) {
  const t = useT();
  const [showTable, setShowTable] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={showTable}
            aria-label={showTable ? t("pages.insights.table.hide") : t("pages.insights.table.show")}
            className="h-9 gap-1.5 rounded-full px-3 text-xs text-muted-foreground"
            onClick={() => setShowTable((v) => !v)}
          >
            {showTable ? <ChartColumn aria-hidden="true" /> : <Table2 aria-hidden="true" />}
            {showTable ? t("pages.insights.table.hide") : t("pages.insights.table.show")}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {summary ? (ready ? summary : <Skeleton className="h-5 w-3/4 rounded" />) : null}
        {!ready ? (
          <Skeleton style={{ height: CHART_HEIGHT }} className="w-full rounded-xl" />
        ) : showTable ? (
          <div className="overflow-x-auto">{table}</div>
        ) : (
          <>
            {/* Recharts assumes LTR; the surrounding text keeps the page direction. */}
            <div dir="ltr" role="group" aria-label={ariaLabel} style={{ height: CHART_HEIGHT }} className="w-full">
              {chart}
            </div>
            {legend}
          </>
        )}
      </CardContent>
    </Card>
  );
}
