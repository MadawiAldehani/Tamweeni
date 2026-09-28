"use client";

import type { CSSProperties } from "react";

import { ItemIcon } from "@/components/common/item-icon";
import type { PantryRow } from "@/components/pantry/pantry-math";
import { PantryWasteRow } from "@/components/pantry/pantry-waste-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { formatNumber } from "@/lib/format";
import { localized, useLanguage } from "@/lib/i18n/provider";
import { unitFor } from "@/lib/plan/units";
import { roundToStep } from "@/lib/ration/consumption";

type PantryItemSliderProps = {
  row: PantryRow;
  value: number;
  onChange: (value: number) => void;
  /** Expired or thrown away since the pickup (already clamped to collected − value). */
  wasted: number;
  onWastedChange: (wasted: number) => void;
  style?: CSSProperties;
};

/** One card per collected item: the big "left" number, a slider from 0 to collected, three quick chips, and an optional waste row. */
export function PantryItemSlider({ row, value, onChange, wasted, onWastedChange, style }: PantryItemSliderProps) {
  const { t, locale } = useLanguage();
  const { item, collected, step } = row;
  const name = localized(item, "name", locale);
  const decimals = item.unit === "kg" ? 2 : 0;
  const n = (qty: number) => formatNumber(qty, locale, decimals);
  const unit = unitFor(item.unit, value, t);
  const used = Math.max(0, collected - value - wasted);
  const half = Math.min(collected, roundToStep(collected / 2, step));

  const chips: { key: "allUsed" | "half" | "untouched"; qty: number }[] = [
    { key: "allUsed", qty: 0 },
    { key: "half", qty: half },
    { key: "untouched", qty: collected },
  ];

  return (
    <Card style={style}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <ItemIcon itemId={item.id} size={44} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="tabular flex items-baseline gap-1.5">
              <bdi className="text-2xl font-semibold leading-none tracking-tight text-primary">
                {n(value)} {unit}
              </bdi>
              <bdi className="text-xs text-muted-foreground">{t("pages.pantry.item.of", { collected: n(collected) })}</bdi>
            </p>
          </div>
        </div>

        <div className="px-4 py-2 [&_[data-slot=slider-thumb]]:size-7 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-primary [&_[data-slot=slider-thumb]]:shadow-md [&_[data-slot=slider-thumb]]:after:-inset-3 [&_[data-slot=slider-track]]:h-2">
          <Slider
            aria-label={t("pages.pantry.item.sliderLabel", { item: name })}
            min={0}
            max={collected}
            step={step}
            value={[value]}
            onValueChange={(next) => onChange(typeof next === "number" ? next : next[0])}
          />
        </div>

        <p className="tabular text-xs text-muted-foreground" aria-live="polite">
          <bdi>{t("pages.pantry.item.used", { used: n(used), unit: unitFor(item.unit, used, t) })}</bdi>
        </p>

        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const active = Math.abs(value - chip.qty) < step / 2;
            return (
              <Button
                key={chip.key}
                variant="outline"
                aria-pressed={active}
                className={active ? "pressable h-11 rounded-full px-4 border-primary bg-accent text-primary" : "pressable h-11 rounded-full px-4"}
                onClick={() => onChange(chip.qty)}
              >
                {t(`pages.pantry.chips.${chip.key}`)}
              </Button>
            );
          })}
        </div>

        <PantryWasteRow row={row} remaining={value} wasted={wasted} onChange={onWastedChange} />
      </CardContent>
    </Card>
  );
}
