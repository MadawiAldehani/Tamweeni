"use client";

import type { CSSProperties } from "react";

import { ItemIcon } from "@/components/common/item-icon";
import { formatNumber } from "@/lib/format";
import { localized, useLanguage } from "@/lib/i18n/provider";
import { unitFor } from "@/lib/plan/units";
import type { MonthSummary } from "@/lib/ration/entitlement";

type PantryShelfProps = {
  summary: MonthSummary;
  memberCount: number;
};

/** The household's month as a snap-scrolling shelf: collected / entitled per item with a thin bar. */
export function PantryShelf({ summary, memberCount }: PantryShelfProps) {
  const { t, locale } = useLanguage();

  const n = (value: number) => formatNumber(value, locale, 1);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between px-0.5">
        <h2 className="text-base font-semibold">{t("pages.home.shelf.monthTitle")}</h2>
        <span className="text-xs text-muted-foreground">
          <bdi>{t("pages.home.shelf.forMembers", { count: memberCount })}</bdi>
        </span>
      </div>

      <ul className="stagger no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scroll-padding-inline:1rem]">
        {summary.items.map((row, index) => {
          const name = localized(row.item, "name", locale);
          const unit = unitFor(row.item.unit, row.collectedQty, t);
          const share = row.entitledQty > 0 ? Math.min(1, row.collectedQty / row.entitledQty) : 0;
          return (
            <li
              key={row.item.id}
              style={{ "--i": index * 0.5 } as CSSProperties}
              className="pressable flex w-[104px] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl bg-card px-2 py-3 text-center ring-1 ring-foreground/5"
            >
              <ItemIcon itemId={row.item.id} size={44} />
              <span className="text-xs font-medium leading-tight">{name}</span>
              <span className="tabular text-xs font-semibold text-primary">
                <bdi>
                  {n(row.collectedQty)} / {n(row.entitledQty)} {unit}
                </bdi>
              </span>
              <span
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(share * 100)}
                aria-label={t("pages.home.shelf.progressLabel", {
                  item: name,
                  collected: n(row.collectedQty),
                  entitled: n(row.entitledQty),
                  unit,
                })}
                className="block h-1 w-full overflow-hidden rounded-full bg-muted"
              >
                <span
                  className="block h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                  style={{ width: `${share * 100}%` }}
                />
              </span>
              {row.item.eligibility === "infant" ? (
                <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                  {t("pages.home.shelf.infantTag")}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
