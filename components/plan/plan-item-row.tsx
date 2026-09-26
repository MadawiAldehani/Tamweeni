"use client";

import { Sparkles } from "lucide-react";
import type { CSSProperties } from "react";

import { ItemIcon } from "@/components/common/item-icon";
import { Stepper } from "@/components/common/stepper";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { localized, useLanguage } from "@/lib/i18n/provider";
import { unitFor } from "@/lib/plan/units";
import { stepFor, type Suggestion } from "@/lib/ration/consumption";

type PlanItemRowProps = {
  suggestion: Suggestion;
  value: number;
  onChange: (qty: number) => void;
  style?: CSSProperties;
};

/** One item: entitlement, what Tamweeni learned, the quantity stepper, and what is left behind. */
export function PlanItemRow({ suggestion, value, onChange, style }: PlanItemRowProps) {
  const { t, locale } = useLanguage();
  const { item, entitledQty, usage, learning } = suggestion;
  const name = localized(item, "name", locale);
  const unit = unitFor(item.unit, entitledQty, t);
  const leaving = Math.max(0, entitledQty - value);
  // Quantities match the stepper (up to 2 dp, e.g. 9.08 kg); learned usage is a rough 1 dp figure.
  const fmt = (n: number) => formatNumber(n, locale, 2);
  const rough = (n: number) => formatNumber(n, locale, 1);

  return (
    <Card style={style} size="sm">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <ItemIcon itemId={item.id} size={44} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-medium">{name}</p>
            <p className="tabular text-xs text-muted-foreground">
              <bdi>{t("pages.plan.item.entitled", { qty: fmt(entitledQty), unit })}</bdi>
            </p>
          </div>
          {learning ? (
            <Badge variant="secondary">
              <Sparkles aria-hidden="true" />
              {t("common.learning")}
            </Badge>
          ) : null}
        </div>

        {!learning && usage.monthlyUsage !== null ? (
          <p className="tabular text-xs text-muted-foreground">
            <bdi>{t("pages.plan.item.usage", { qty: rough(usage.monthlyUsage), unit })}</bdi>
            {usage.pantryEstimate > 0 ? (
              <>
                {" · "}
                <bdi>{t("pages.plan.item.pantry", { qty: rough(usage.pantryEstimate), unit })}</bdi>
              </>
            ) : null}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <Stepper
            value={value}
            onChange={onChange}
            min={0}
            max={entitledQty}
            step={stepFor(item)}
            unit={unit}
            decrementLabel={t("pages.plan.item.decrement", { item: name })}
            incrementLabel={t("pages.plan.item.increment", { item: name })}
          />
          {leaving > 0 ? (
            <p className="tabular text-xs font-medium text-primary">
              <bdi>{t("pages.plan.item.leaving", { qty: fmt(leaving), unit })}</bdi>
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
