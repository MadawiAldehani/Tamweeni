"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Shown after the number, e.g. "kg". */
  unit?: string;
  /** Decimals to display; defaults to the number of decimals in `step`. */
  decimals?: number;
  disabled?: boolean;
  /** aria-label for the − button (already translated). */
  decrementLabel: string;
  /** aria-label for the + button (already translated). */
  incrementLabel: string;
  className?: string;
};

function decimalsOf(step: number) {
  const text = String(step);
  const i = text.indexOf(".");
  return i === -1 ? 0 : text.length - i - 1;
}

/** "− value +" quantity control. A flex row, so it mirrors itself in RTL. */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  unit,
  decimals,
  disabled = false,
  decrementLabel,
  incrementLabel,
  className,
}: StepperProps) {
  const places = decimals ?? decimalsOf(step);
  const atMin = value <= min;
  const atMax = value >= max;

  function commit(next: number) {
    const clamped = Math.min(max, Math.max(min, next));
    onChange(Number(clamped.toFixed(places)));
  }

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11 rounded-full"
        aria-label={decrementLabel}
        disabled={disabled || atMin}
        onClick={() => commit(value - step)}
      >
        <Minus className="size-5" />
      </Button>
      <span
        className="tabular min-w-16 text-center text-lg font-semibold"
        aria-live="polite"
      >
        {value.toFixed(places)}
        {unit ? (
          <span className="ms-1 text-sm font-normal text-muted-foreground">{unit}</span>
        ) : null}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11 rounded-full"
        aria-label={incrementLabel}
        disabled={disabled || atMax}
        onClick={() => commit(value + step)}
      >
        <Plus className="size-5" />
      </Button>
    </div>
  );
}
