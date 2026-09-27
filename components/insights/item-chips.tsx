"use client";

import type { CSSProperties } from "react";

import { ItemIcon } from "@/components/common/item-icon";
import { localized, useLanguage } from "@/lib/i18n/provider";
import type { RationItem, RationItemId } from "@/lib/ration/catalog";
import { cn } from "@/lib/utils";

type ItemChipsProps = {
  items: RationItem[];
  selected: RationItemId;
  onSelect: (id: RationItemId) => void;
};

/** Snap-scrolling row of item chips that picks which item the chart shows. */
export function ItemChips({ items, selected, onSelect }: ItemChipsProps) {
  const { t, locale } = useLanguage();

  return (
    <div role="group" aria-label={t("pages.insights.chips.label")} className="stagger no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 py-1 [scroll-padding-inline:1rem]">
      {items.map((item, index) => {
        const active = item.id === selected;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(item.id)}
            style={{ "--i": Math.min(index, 8) * 0.4 } as CSSProperties}
            className={cn(
              "pressable flex h-11 shrink-0 snap-start items-center gap-2 rounded-full ps-1.5 pe-3.5 text-sm font-medium ring-1 transition-colors",
              active
                ? "bg-primary text-primary-foreground ring-primary"
                : "bg-card text-foreground ring-foreground/10 hover:bg-muted",
            )}
          >
            <ItemIcon itemId={item.id} size={28} className={cn(active && "ring-2 ring-primary-foreground/40")} />
            <span className="whitespace-nowrap">{localized(item, "name", locale)}</span>
          </button>
        );
      })}
    </div>
  );
}
