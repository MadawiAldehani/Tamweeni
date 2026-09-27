"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import type { CSSProperties } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ItemIcon } from "@/components/common/item-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { localized, useLanguage } from "@/lib/i18n/provider";
import type { WasteRow } from "@/lib/insights/series";
import type { RationUnit } from "@/lib/ration/catalog";

/** Ranked list of items by the share left unused, with a thin warm bar; the top row links to donating. */
export function WasteRiskList({ rows }: { rows: WasteRow[] }) {
  const { t, locale } = useLanguage();
  const unitLabel = (unit: RationUnit) => (unit === "can" ? t("units.cans") : t(`units.${unit}`));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pages.insights.waste.title")}</CardTitle>
        <CardDescription>{t("pages.insights.waste.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={t("pages.insights.waste.empty.title")}
            description={t("pages.insights.waste.empty.description")}
            className="py-4"
            action={
              <Button nativeButton={false} className="pressable h-11 rounded-xl px-4" render={<Link href="/pantry" />}>
                {t("pages.insights.waste.empty.cta")}
              </Button>
            }
          />
        ) : (
          <ol className="stagger flex flex-col divide-y divide-border/60">
            {rows.map((row, index) => {
              const name = localized(row.item, "name", locale);
              const unit = unitLabel(row.item.unit);
              const pct = Math.round(row.unusedShare * 100);
              const qty = formatNumber(row.unused, locale, 1);
              // Arabic uses the dual for two months, so "2" never appears as a digit there.
              const detail =
                row.monthsWithData === 1
                  ? t("pages.insights.waste.unusedOne", { qty, unit })
                  : row.monthsWithData === 2
                    ? t("pages.insights.waste.unusedTwo", { qty, unit })
                    : t("pages.insights.waste.unused", { qty, unit, count: row.monthsWithData });
              return (
                <li key={row.item.id} style={{ "--i": Math.min(index, 8) * 0.5 } as CSSProperties} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <ItemIcon itemId={row.item.id} size={40} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-medium">{name}</span>
                      <span className="tabular shrink-0 text-lg font-semibold leading-none">
                        <bdi>{pct}%</bdi>
                      </span>
                    </div>
                    <span
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={pct}
                      aria-label={t("pages.insights.waste.shareLabel", { item: name, pct })}
                      className="block h-1 w-full overflow-hidden rounded-full bg-muted"
                    >
                      <span className="block h-full rounded-full bg-warm transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="text-xs text-muted-foreground">
                      <bdi>{detail}</bdi>
                      {index === 0 && row.unused > 0 ? (
                        <>
                          {" · "}
                          <Link href="/donate" className="inline-flex items-center gap-0.5 font-medium text-warm underline-offset-4 hover:underline">
                            {t("pages.insights.waste.donate")}
                            <ArrowRight className="size-3 rtl:-scale-x-100" aria-hidden="true" />
                          </Link>
                        </>
                      ) : null}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
