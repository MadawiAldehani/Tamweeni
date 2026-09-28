"use client";

import { useState } from "react";

import { Stepper } from "@/components/common/stepper";
import type { PantryRow } from "@/components/pantry/pantry-math";
import { wasteStep } from "@/components/pantry/pantry-math";
import { useLanguage } from "@/lib/i18n/provider";
import { unitFor } from "@/lib/plan/units";

type PantryWasteRowProps = {
  row: PantryRow;
  /** What is still in the pantry (the slider value); waste can only come out of the rest. */
  remaining: number;
  wasted: number;
  onChange: (wasted: number) => void;
};

/**
 * Optional "Expired or thrown away?" stepper under an item's slider. Collapsed behind a quiet
 * "+ Add waste" button so the default flow stays one slider per item; it opens by itself when a
 * saved value is already above zero.
 */
export function PantryWasteRow({ row, remaining, wasted, onChange }: PantryWasteRowProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(wasted > 0);
  const max = Math.max(0, Number((row.collected - remaining).toFixed(2)));
  const step = wasteStep(row.item.unit);

  if (!open && wasted <= 0) {
    return (
      <button
        type="button"
        className="pressable -ms-1 min-h-11 self-start rounded-lg px-1 text-start text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        onClick={() => setOpen(true)}
      >
        {t("pages.pantry.waste.add")}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{t("pages.pantry.waste.question")}</p>
        <button
          type="button"
          className="pressable min-h-11 rounded-lg px-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          onClick={() => {
            onChange(0);
            setOpen(false);
          }}
        >
          {t("pages.pantry.waste.remove")}
        </button>
      </div>
      <Stepper
        value={wasted}
        onChange={onChange}
        min={0}
        max={max}
        step={step}
        decimals={row.item.unit === "kg" ? 1 : 0}
        unit={unitFor(row.item.unit, wasted, t)}
        decrementLabel={t("pages.pantry.waste.decrement")}
        incrementLabel={t("pages.pantry.waste.increment")}
      />
    </div>
  );
}
