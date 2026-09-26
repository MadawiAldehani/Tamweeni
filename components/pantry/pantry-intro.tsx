"use client";

import { CalendarCheck, Lightbulb, ScanLine } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PickupWithLines } from "@/lib/data/types";
import { formatDate } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";

/** "Collected on {date} · {n} days ago" chip, then the one-paragraph explanation on a green tint. */
export function PantryIntro({ pickups, daysAgo, style }: { pickups: PickupWithLines[]; daysAgo: number | null; style?: CSSProperties }) {
  const { t, locale } = useLanguage();
  const dates = pickups.map((p) => formatDate(p.pickup_date, locale)).join(" · ");
  const ago = daysAgo === null ? "" : agoLabel(daysAgo);

  /** Arabic counts 2 as a dual and 3–10 with a plural noun; English reads the same throughout. */
  function agoLabel(count: number): string {
    if (count === 0) return t("pages.pantry.today");
    if (count === 1) return t("pages.pantry.yesterday");
    if (count === 2) return t("pages.pantry.twoDaysAgo");
    return t(count <= 10 ? "pages.pantry.daysAgoFew" : "pages.pantry.daysAgo", { count });
  }

  return (
    <div style={style} className="flex flex-col gap-3">
      {dates ? (
        <span className="tabular inline-flex w-fit items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          <CalendarCheck className="size-3.5 shrink-0" aria-hidden="true" />
          <bdi>
            {t("pages.pantry.collectedOn", { date: dates })}
            {ago ? ` · ${ago}` : ""}
          </bdi>
        </span>
      ) : null}
      <Card className="bg-accent ring-0">
        <CardContent className="flex items-start gap-3">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm leading-snug">{t("pages.pantry.intro")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

/** Shown when nothing has been collected this month: the receipt comes first. */
export function PantryEmpty() {
  const { t } = useLanguage();

  return (
    <Card>
      <CardContent>
        <EmptyState
          icon={ScanLine}
          title={t("pages.pantry.empty.title")}
          description={t("pages.pantry.empty.description")}
          className="py-6"
          action={
            <Button nativeButton={false} size="lg" className="pressable h-11 rounded-xl px-5" render={<Link href="/scan" />}>
              {t("pages.pantry.empty.scan")}
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
}
