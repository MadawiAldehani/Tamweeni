"use client";

import Link from "next/link";
import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Snapshot } from "@/lib/data/types";
import { daysLeftInMonth, formatNumber, monthLabel } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import { monthlySeries, type MonthPoint } from "@/lib/insights/series";
import { hasPickupIn, planMonthFor, savedPlanFor } from "@/lib/plan/month";
import { RATION_ITEM_IDS, getItem } from "@/lib/ration/catalog";

type Review = { month: string; leftOver: number; gave: number; wasted: number };

/**
 * Kilos and litres left over / given / wasted last month; cans are left out because tins do not add
 * up with kilos. Leftovers are net of what was given: a gift comes out of what was still at home.
 */
function reviewOf(point: MonthPoint): Review {
  const review: Review = { month: point.month, leftOver: 0, gave: 0, wasted: 0 };
  for (const id of RATION_ITEM_IDS) {
    if (getItem(id).unit === "can") continue;
    const entry = point.items[id];
    review.leftOver += Math.max(0, (entry.atHome ?? 0) - entry.donated);
    review.gave += entry.donated;
    review.wasted += entry.wasted ?? 0;
  }
  return review;
}

/**
 * Last month's leftovers, gifts and waste as evidence for the next plan: shown near month end or
 * while the next plan is still unsaved, and only once last month has both a pickup and a check-in.
 * It never suggests taking more — leftovers are a reason to take a little less.
 */
export function MonthReviewCard({ snapshot, now }: { snapshot: Snapshot; now: Date | null }) {
  const { t, locale } = useLanguage();
  if (!now) return null;

  const [previous] = monthlySeries(snapshot, now, 2);
  if (!previous.hasCheckin || !hasPickupIn(snapshot.pickups, previous.month)) return null;

  // The plan the CTA opens: this month until a pickup is recorded, then next month.
  const plan = planMonthFor(snapshot, now);
  const planSaved = savedPlanFor(snapshot, plan.month) !== null;
  if (daysLeftInMonth(now) > 5 && planSaved) return null;

  const review = reviewOf(previous);
  const planMonth = monthLabel(plan.month, locale, "long");
  const kg = (n: number) => formatNumber(n, locale, 1);
  const stats = [
    { key: "pages.home.review.leftOver" as const, value: review.leftOver },
    { key: "pages.home.review.gave" as const, value: review.gave },
    { key: "pages.home.review.wasted" as const, value: review.wasted },
  ].filter((s) => s.value > 0);

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-center gap-2 text-muted-foreground">
        <History className="size-4 shrink-0" aria-hidden="true" />
        <p className="text-[11px] font-medium uppercase tracking-[0.08em]">
          <bdi>{t("pages.home.review.eyebrow", { month: monthLabel(review.month, locale, "long") })}</bdi>
        </p>
      </div>
      {stats.length > 0 ? (
        <p className="tabular flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm font-semibold leading-tight">
          {stats.map((s, i) => (
            <span key={s.key} className="inline-flex items-baseline gap-2">
              {i > 0 ? <span aria-hidden="true" className="font-normal text-muted-foreground">·</span> : null}
              <bdi>{t(s.key, { kg: kg(s.value) })}</bdi>
            </span>
          ))}
        </p>
      ) : (
        <p className="text-sm font-semibold leading-tight">{t("pages.home.review.usedAll")}</p>
      )}
      <p className="text-sm leading-snug text-muted-foreground">
        <bdi>{t("pages.home.review.body", { month: planMonth })}</bdi>
      </p>
      <Button nativeButton={false} className="pressable h-11 w-full rounded-xl" render={<Link href="/plan" />}>
        <bdi>{t("pages.home.review.cta", { month: planMonth })}</bdi>
      </Button>
    </div>
  );
}
