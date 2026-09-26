"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

import { daysSince, pickupsFor } from "@/components/pantry/pantry-math";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSnapshot } from "@/lib/data/provider";
import { currentMonth } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import { nextStep } from "@/lib/ration/insights";

/** A gentle nudge on the home screen once the pickup is a week old and the pantry has not been checked. */
export function PantryPromptCard({ style }: { style?: CSSProperties }) {
  const t = useT();
  const snapshot = useSnapshot();
  // `now` fills in after mount so server and client render the same markup.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  if (!now || nextStep(snapshot, now) !== "checkin") return null;

  const pickup = pickupsFor(snapshot.pickups, currentMonth(now)).at(-1);
  const days = pickup ? daysSince(pickup.pickup_date, now) : 0;
  // Arabic needs the plural noun for 3–10 days; the prompt only shows from a week on.
  const bodyKey = days >= 3 && days <= 10 ? "pages.pantry.prompt.bodyFew" : "pages.pantry.prompt.body";

  return (
    <Card style={style} className="bg-accent ring-primary/20">
      <CardContent className="flex items-center gap-3">
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-2xl">
          🧺
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">{t("pages.pantry.prompt.title")}</p>
          <p className="tabular text-xs text-muted-foreground">
            <bdi>{t(bodyKey, { count: days })}</bdi>
          </p>
        </div>
        <Button nativeButton={false} className="pressable h-11 shrink-0 rounded-xl px-4" render={<Link href="/pantry" />}>
          {t("pages.pantry.prompt.cta")}
        </Button>
      </CardContent>
    </Card>
  );
}
