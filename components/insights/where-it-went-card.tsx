"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import type { CSSProperties } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, monthLabel } from "@/lib/format";
import { localized, useLanguage } from "@/lib/i18n/provider";
import { whereItemWent, type MonthPoint, type WhereItWent } from "@/lib/insights/series";
import { unitFor } from "@/lib/plan/units";
import type { RationItem } from "@/lib/ration/catalog";
import { cn } from "@/lib/utils";

type WhereItWentCardProps = { points: MonthPoint[]; item: RationItem };

type RowKey = "used" | "donated" | "wasted" | "atHome";

/** Row → fill token: green for used, terracotta for giving, muted ink for waste, sand for the shelf. */
const FILL: Record<RowKey, string> = {
  used: "bg-primary",
  donated: "bg-warm",
  wasted: "bg-chart-5",
  atHome: "bg-secondary ring-1 ring-inset ring-border",
};

const ROWS: RowKey[] = ["used", "donated", "wasted", "atHome"];

/**
 * Four labelled bars for the latest checked-in month: used, donated, wasted, still at home.
 * Donations are leftovers the family already collected, so they come out of what was still at
 * home; the four bars share `collected` as the base and add up to 100 %.
 */
export function WhereItWentCard({ points, item }: WhereItWentCardProps) {
  const { t, locale } = useLanguage();
  const name = localized(item, "name", locale);
  const went: WhereItWent | null = whereItemWent(points, item.id);
  const month = went ? monthLabel(went.month, locale, "long") : "";
  const base = went ? went.collected : 0;
  const atHome = went ? Math.max(0, went.atHome - went.donated) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{went ? t("pages.insights.where.title", { item: name, month }) : name}</CardTitle>
        <CardDescription>{t("pages.insights.where.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {!went ? (
          <EmptyState
            icon={ClipboardList}
            title={t("pages.insights.where.empty")}
            className="py-4"
            action={
              <Button nativeButton={false} className="pressable h-11 rounded-xl px-4" render={<Link href="/pantry" />}>
                {t("pages.insights.where.cta")}
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            <ul className="stagger flex flex-col gap-3">
              {ROWS.map((key, index) => {
                const value = Math.min(key === "atHome" ? atHome : went[key], base);
                const label = t(`pages.insights.series.${key}`);
                const pct = base > 0 ? Math.round((Math.min(value, base) / base) * 100) : 0;
                const qty = formatNumber(value, locale, 1);
                const unit = unitFor(item.unit, value, t);
                return (
                  <li key={key} style={{ "--i": index * 0.5 } as CSSProperties} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <span aria-hidden="true" className={cn("inline-block size-2.5 shrink-0 rounded-full", FILL[key])} />
                        {label}
                      </span>
                      <span className="tabular shrink-0 text-muted-foreground">
                        <bdi>
                          {qty} {unit}
                        </bdi>
                      </span>
                    </div>
                    <span
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={pct}
                      aria-label={t("pages.insights.where.share", { label, pct })}
                      className="block h-1.5 w-full overflow-hidden rounded-full bg-muted"
                    >
                      <span className={cn("block h-full rounded-full transition-[width] duration-500 ease-out", FILL[key])} style={{ width: `${pct}%` }} />
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="tabular text-xs text-muted-foreground">
              <bdi>
                {t("pages.insights.where.collected", {
                  qty: formatNumber(went.collected, locale, 1),
                  unit: unitFor(item.unit, went.collected, t),
                })}
              </bdi>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
