"use client";

import { Check, Ticket, Undo2 } from "lucide-react";
import type { CSSProperties } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Donation, DonationStatus } from "@/lib/data/types";
import { groupByVoucher, voucherLines } from "@/lib/donate/voucher";
import { formatDate, formatNumber, monthLabel } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";

type DonationHistoryProps = {
  donations: Donation[];
  onOpenVoucher: (code: string) => void;
  onToggleStatus: (code: string, next: DonationStatus) => void;
};

const at = (i: number) => ({ "--i": Math.min(i, 8) }) as CSSProperties;

/** Past pledges, one card per voucher, newest first. Renders nothing when the family has not pledged yet. */
export function DonationHistory({ donations, onOpenVoucher, onToggleStatus }: DonationHistoryProps) {
  const { t, locale } = useLanguage();
  const groups = groupByVoucher(donations);
  if (groups.length === 0) return null;

  return (
    <section className="flex flex-col gap-3" aria-labelledby="donation-history-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="donation-history-title" className="text-lg font-semibold">
          {t("pages.donate.history.title")}
        </h2>
        <span className="tabular text-sm text-muted-foreground">
          <bdi>
            {t(groups.length === 1 ? "pages.donate.history.countOne" : "pages.donate.history.count", {
              count: formatNumber(groups.length, locale, 0),
            })}
          </bdi>
        </span>
      </div>

      <div className="stagger flex flex-col gap-3">
        {groups.map((g, i) => {
          const collected = g.status === "collected";
          const summary = voucherLines(g.donations, locale, t)
            .map((l) => `${formatNumber(l.qty, locale, 2)} ${l.unit} ${l.name}`)
            .join(" · ");
          return (
            <Card key={g.code} style={at(i)}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <bdi dir="ltr" className="font-mono text-base font-semibold tracking-[0.15em]">
                      {g.code}
                    </bdi>
                    <p className="tabular text-xs text-muted-foreground">
                      <bdi>{monthLabel(g.month, locale)}</bdi>
                      <span className="mx-1.5">·</span>
                      <bdi>{formatDate(g.created_at, locale)}</bdi>
                    </p>
                  </div>
                  <Badge variant={collected ? "default" : "secondary"} className="shrink-0">
                    {collected ? <Check aria-hidden="true" /> : null}
                    {t(collected ? "pages.donate.voucher.statusCollected" : "pages.donate.voucher.statusPledged")}
                  </Badge>
                </div>

                <p className="tabular text-sm">
                  <bdi>{summary}</bdi>
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    className="pressable h-11 flex-1 rounded-xl"
                    onClick={() => onOpenVoucher(g.code)}
                  >
                    <Ticket aria-hidden="true" />
                    {t("pages.donate.history.viewVoucher")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className={collected ? "pressable h-11 flex-1 rounded-xl text-muted-foreground" : "pressable h-11 flex-1 rounded-xl text-primary"}
                    onClick={() => onToggleStatus(g.code, collected ? "pledged" : "collected")}
                  >
                    {collected ? <Undo2 aria-hidden="true" className="rtl:-scale-x-100" /> : <Check aria-hidden="true" />}
                    {t(collected ? "pages.donate.history.markPledged" : "pages.donate.history.markCollected")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
