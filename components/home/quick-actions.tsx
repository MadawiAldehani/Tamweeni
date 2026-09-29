"use client";

import Link from "next/link";

import { useT } from "@/lib/i18n/provider";
import type { TKey } from "@/lib/i18n/provider";
import type { NextStep } from "@/lib/ration/insights";
import { cn } from "@/lib/utils";

export type { NextStep } from "@/lib/ration/insights";

type Action = {
  id: NextStep;
  href: string;
  emoji: string;
  /** Terracotta is reserved for giving: only the leftovers circle uses bg-warm. */
  circleTint: string;
  labelKey: TKey;
  hintKey: TKey;
};

const scan: Action = { id: "scan", href: "/scan", emoji: "📷", circleTint: "bg-secondary/60", labelKey: "pages.home.actions.scan", hintKey: "pages.home.actions.scanHint" };
const plan: Action = { id: "plan", href: "/plan", emoji: "📝", circleTint: "bg-secondary/60", labelKey: "pages.home.actions.plan", hintKey: "pages.home.actions.planHint" };
const checkin: Action = { id: "checkin", href: "/pantry", emoji: "🧺", circleTint: "bg-secondary/60", labelKey: "pages.home.actions.checkin", hintKey: "pages.home.actions.checkinHint" };
const donate: Action = { id: "donate", href: "/donate", emoji: "🤲", circleTint: "bg-warm/15", labelKey: "pages.home.actions.donate", hintKey: "pages.home.actions.donateHint" };

/**
 * Three tiles; the middle one is Plan unless a pantry check-in is due or already possible (this month has a pickup).
 * The last tile is "Leftovers": it only carries the "Next" badge after a check-in shows real leftovers.
 */
function actionsFor(nextStep: NextStep, checkinReady: boolean): Action[] {
  return [scan, nextStep === "checkin" || checkinReady ? checkin : plan, donate];
}

type QuickActionsProps = {
  nextStep: NextStep;
  /** True once this month has a pickup: the check-in tile stays reachable even when Plan is the "Next" step. */
  checkinReady: boolean;
};

/** Scan / Plan (or Check-in) / Leftovers tiles; at most one carries the "Next" badge. */
export function QuickActions({ nextStep, checkinReady }: QuickActionsProps) {
  const t = useT();

  return (
    <div className="grid grid-cols-3 gap-3">
      {actionsFor(nextStep, checkinReady).map((action) => {
        const isNext = action.id === nextStep;
        return (
          <Link
            key={action.id}
            href={action.href}
            className={cn(
              "pressable relative flex flex-col items-center gap-2 rounded-2xl bg-card px-2 py-4 text-center ring-1 ring-foreground/10 transition-colors hover:bg-accent/60",
              isNext && "bg-accent ring-2 ring-primary",
            )}
          >
            {isNext ? (
              <span className="absolute -top-2 end-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                {t("common.next")}
              </span>
            ) : null}
            <span
              aria-hidden="true"
              className={cn("flex size-11 items-center justify-center rounded-full text-2xl", action.circleTint)}
            >
              {action.emoji}
            </span>
            <span className="text-sm font-semibold leading-tight">{t(action.labelKey)}</span>
            <span className="text-[11px] leading-tight text-muted-foreground">{t(action.hintKey)}</span>
          </Link>
        );
      })}
    </div>
  );
}
