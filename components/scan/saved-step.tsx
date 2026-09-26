"use client";

import { Check, Sprout } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import { StatNumber } from "@/components/common/stat-number";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatKD, formatNumber } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import type { ReviewTotals } from "@/lib/receipt/review";

type SavedStepProps = {
  totals: ReviewTotals;
  onScanAnother: () => void;
};

const at = (i: number) => ({ "--i": i }) as CSSProperties;

/** Step 4: a green check, the pickup's totals, and the way back home. */
export function SavedStep({ totals, onScanAnother }: SavedStepProps) {
  const { t, locale } = useLanguage();

  return (
    <div className="stagger flex flex-col gap-4">
      <Card style={at(0)}>
        <CardContent className="flex flex-col items-center gap-4 py-4 text-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_30px_-12px_rgba(31,111,74,0.7)] animate-in zoom-in-50 duration-500 fill-mode-both">
            <Check className="size-10 animate-in fade-in zoom-in-75 delay-150 duration-300 fill-mode-both" strokeWidth={3} aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold">{t("pages.scan.saved.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("pages.scan.saved.subtitle")}</p>
          </div>

          <div className="grid w-full grid-cols-3 gap-2 rounded-xl bg-muted/60 p-3">
            <StatNumber value={formatNumber(totals.count, locale, 0)} label={t("pages.scan.saved.items")} align="center" />
            <StatNumber value={formatNumber(totals.volumeQty, locale)} label={t("pages.scan.saved.volume")} align="center" />
            <StatNumber value={formatKD(totals.subsidyKD, locale, 0)} label={t("pages.scan.saved.subsidy")} tone="primary" align="center" />
          </div>
        </CardContent>
      </Card>

      <div style={at(1)} className="flex items-start gap-2.5 rounded-xl bg-accent px-4 py-3 text-sm text-foreground">
        <Sprout className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p>{t("pages.scan.saved.hint")}</p>
      </div>

      <div style={at(2)} className="flex flex-col gap-2">
        <Button nativeButton={false} size="lg" className="pressable h-12 rounded-xl text-base" render={<Link href="/home" />}>
          {t("pages.scan.saved.backHome")}
        </Button>
        <Button size="lg" variant="outline" className="pressable h-12 rounded-xl text-base" onClick={onScanAnother}>
          {t("pages.scan.saved.scanAnother")}
        </Button>
      </div>
    </div>
  );
}
