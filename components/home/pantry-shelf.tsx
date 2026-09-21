"use client";

import type { CSSProperties } from "react";

import { ItemIcon } from "@/components/common/item-icon";
import { formatNumber } from "@/lib/format";
import { localized, useLanguage } from "@/lib/i18n/provider";
import { RATION_ITEMS, type RationItem } from "@/lib/ration/catalog";

/** The 11 catalog items as a snap-scrolling shelf; per-person quotas until household setup. */
export function PantryShelf() {
  const { t, locale } = useLanguage();

  const unitLabel = (item: RationItem) =>
    item.unit === "can" && item.qty_per_person > 1 ? t("units.cans") : t(`units.${item.unit}`);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between px-0.5">
        <h2 className="text-base font-semibold">{t("pages.home.shelf.title")}</h2>
        <span className="text-xs text-muted-foreground">{t("common.perPerson")}</span>
      </div>

      <ul className="stagger no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scroll-padding-inline:1rem]">
        {RATION_ITEMS.map((item, index) => (
          <li
            key={item.id}
            style={{ "--i": index * 0.5 } as CSSProperties}
            className="pressable flex w-[104px] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl bg-card px-2 py-3 text-center ring-1 ring-foreground/5"
          >
            <ItemIcon itemId={item.id} size={44} />
            <span className="text-xs font-medium leading-tight">{localized(item, "name", locale)}</span>
            <span className="tabular text-xs font-semibold text-primary">
              <bdi>
                {formatNumber(item.qty_per_person, locale, 2)} {unitLabel(item)}
              </bdi>
            </span>
            {item.eligibility === "infant" ? (
              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                {t("pages.home.shelf.infantTag")}
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="px-0.5 text-xs text-muted-foreground">{t("pages.home.shelf.caption")}</p>
    </section>
  );
}
