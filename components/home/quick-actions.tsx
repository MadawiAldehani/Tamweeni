"use client";

import Link from "next/link";

import { useT } from "@/lib/i18n/provider";
import type { TKey } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export type NextStep = "scan" | "plan" | "donate";

type Action = {
  id: NextStep;
  href: string;
  emoji: string;
  /** Terracotta is reserved for giving: only the donate circle uses bg-warm. */
  circleTint: string;
  labelKey: TKey;
  hintKey: TKey;
};

const actions: Action[] = [
  { id: "scan", href: "/scan", emoji: "📷", circleTint: "bg-secondary/60", labelKey: "pages.home.actions.scan", hintKey: "pages.home.actions.scanHint" },
  { id: "plan", href: "/plan", emoji: "📝", circleTint: "bg-secondary/60", labelKey: "pages.home.actions.plan", hintKey: "pages.home.actions.planHint" },
  { id: "donate", href: "/donate", emoji: "🤲", circleTint: "bg-warm/15", labelKey: "pages.home.actions.donate", hintKey: "pages.home.actions.donateHint" },
];

/** Scan / Plan / Donate tiles; exactly one carries the "Next" badge. */
export function QuickActions({ nextStep }: { nextStep: NextStep }) {
  const t = useT();

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((action) => {
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
