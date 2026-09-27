"use client";

import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type StepDotsProps = {
  count: number;
  active: number;
  onSelect: (index: number) => void;
};

/** Progress dots for the story; the active one stretches into a short bar. */
export function StepDots({ count, active, onSelect }: StepDotsProps) {
  const t = useT();

  return (
    <div className="flex items-center justify-center gap-4" role="group" aria-label={t("pages.onboarding.storyLabel")}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-pressed={active === i}
          aria-label={t("pages.onboarding.beatLabel", { n: i + 1 })}
          onClick={() => onSelect(i)}
          className={cn(
            // The 8 px dot keeps its look; the pseudo-element gives it a ~40 px tap target.
            "relative h-2 rounded-full transition-all duration-300 before:absolute before:-inset-4 before:content-['']",
            active === i ? "w-6 bg-primary" : "w-2 bg-foreground/20",
          )}
        />
      ))}
    </div>
  );
}
