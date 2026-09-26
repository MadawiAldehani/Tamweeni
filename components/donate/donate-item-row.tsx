"use client";

import type { CSSProperties } from "react";

import { ItemIcon } from "@/components/common/item-icon";
import { Stepper } from "@/components/common/stepper";
import { Card, CardContent } from "@/components/ui/card";
import type { DonationDraftLine } from "@/lib/donate/prefill";
import { formatNumber } from "@/lib/format";
import { localized, useLanguage } from "@/lib/i18n/provider";
import { unitFor } from "@/lib/plan/units";
import { stepFor } from "@/lib/ration/consumption";

type DonateItemRowProps = {
  line: DonationDraftLine;
  onChange: (qty: number) => void;
  disabled?: boolean;
  style?: CSSProperties;
};

/** One item the family can give: icon, name, "up to" its surplus, and the quantity stepper. */
export function DonateItemRow({ line, onChange, disabled = false, style }: DonateItemRowProps) {
  const { t, locale } = useLanguage();
  const { item, qty, maxQty } = line;
  const name = localized(item, "name", locale);
  const unit = unitFor(item.unit, maxQty, t);

  return (
    <Card style={style} size="sm">
      {/* Stacked like PlanItemRow: the stepper gets its own row so long names ("Long-life milk", "حليب طويل الأمد") never truncate. */}
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <ItemIcon itemId={item.id} size={44} />
          <div className="min-w-0 flex-1">
            <p className="text-base font-medium">{name}</p>
            <p className="tabular text-xs text-muted-foreground">
              <bdi>{t("pages.donate.item.upTo", { qty: formatNumber(maxQty, locale, 2), unit })}</bdi>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <Stepper
            value={qty}
            onChange={onChange}
            min={0}
            max={maxQty}
            step={stepFor(item)}
            unit={unitFor(item.unit, qty, t)}
            disabled={disabled}
            decrementLabel={t("pages.donate.item.decrement", { item: name })}
            incrementLabel={t("pages.donate.item.increment", { item: name })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
