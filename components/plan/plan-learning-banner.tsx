"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/lib/i18n/provider";

type PlanLearningBannerProps = {
  /** The pantry check-in needs this month's pickup first. */
  checkinReady: boolean;
  style?: CSSProperties;
};

/** Shown while no item has usage history: take what you need, then check in next week. */
export function PlanLearningBanner({ checkinReady, style }: PlanLearningBannerProps) {
  const t = useT();

  return (
    <Card style={style} className="bg-accent ring-0">
      <CardContent className="flex items-start gap-3">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="font-medium leading-snug">{t("pages.plan.learning.title")}</p>
          <p className="text-sm leading-snug text-accent-foreground">{t("pages.plan.learning.body")}</p>
          {checkinReady ? (
            <Link href="/pantry" className="pressable inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary">
              {t("pages.plan.learning.checkin")}
              <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground">{t("pages.plan.learning.afterPickup")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
