"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import { ItemIcon } from "@/components/common/item-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { UsedItem } from "@/components/pantry/pantry-math";
import { useSnapshot } from "@/lib/data/provider";
import { currentMonth, formatNumber } from "@/lib/format";
import { localized, useLanguage } from "@/lib/i18n/provider";
import { unitFor } from "@/lib/plan/units";
import { getItem } from "@/lib/ration/catalog";
import { estimateItemUsage, monthlyUsageFor } from "@/lib/ration/consumption";

type PantrySuccessProps = {
  /** Quantity used per item in this check-in, most first. */
  used: UsedItem[];
  now: Date;
};

const at = (i: number) => ({ "--i": i }) as CSSProperties;

/** After the save: a green check, what Tamweeni learned per item, and the two ways onward. */
export function PantrySuccess({ used, now }: PantrySuccessProps) {
  const { t, locale } = useLanguage();
  // Read the snapshot here: mutate() has already reloaded it with the new check-ins.
  const snapshot = useSnapshot();
  const month = currentMonth(now);

  // Only items the family actually used: an untouched slider teaches nothing worth showing.
  const learned = used
    .filter((u) => u.used > 0)
    .slice(0, 3)
    .map(({ id }) => {
      const item = getItem(id);
      const { monthlyUsage: history, monthsOfData } = estimateItemUsage(snapshot, id, now);
      const current = monthlyUsageFor(snapshot, id, month)?.monthlyUsage ?? null;
      // Blend this check-in into the history so the figure reflects what was just saved.
      const monthly = history !== null && current !== null ? (history * monthsOfData + current) / (monthsOfData + 1) : (history ?? current);
      return { item, monthly };
    });

  return (
    <div className="stagger flex flex-col gap-4">
      <Card style={at(0)}>
        <CardContent className="flex flex-col items-center gap-4 py-4 text-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_30px_-12px_rgba(31,111,74,0.7)] animate-in zoom-in-50 duration-500 fill-mode-both">
            <Check className="size-10 animate-in fade-in zoom-in-75 delay-150 duration-300 fill-mode-both" strokeWidth={3} aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold">{t("pages.pantry.success.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("pages.pantry.success.subtitle")}</p>
          </div>
        </CardContent>
      </Card>

      {learned.length > 0 ? (
        <Card style={at(1)}>
          <CardContent className="flex flex-col gap-3">
            <h3 className="text-base font-semibold">{t("pages.pantry.success.learned")}</h3>
            <ul className="flex flex-col gap-2">
              {learned.map(({ item, monthly }) => (
                <li key={item.id} className="flex items-center gap-3">
                  <ItemIcon itemId={item.id} size={36} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{localized(item, "name", locale)}</span>
                  {monthly === null ? (
                    <Badge variant="secondary">{t("pages.pantry.success.learning")}</Badge>
                  ) : (
                    <bdi className="tabular text-sm font-semibold text-primary">
                      {t("pages.pantry.success.usageRow", {
                        qty: formatNumber(monthly, locale, 1),
                        unit: unitFor(item.unit, monthly, t),
                      })}
                    </bdi>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div style={at(2)} className="flex flex-col gap-2">
        <Button nativeButton={false} size="lg" className="pressable h-12 rounded-xl text-base" render={<Link href="/plan" />}>
          {t("pages.pantry.success.plan")}
        </Button>
        <Button nativeButton={false} size="lg" variant="outline" className="pressable h-12 rounded-xl text-base" render={<Link href="/home" />}>
          {t("pages.pantry.success.backHome")}
        </Button>
      </div>
    </div>
  );
}
