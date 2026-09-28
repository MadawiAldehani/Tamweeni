"use client";

import { ClipboardList, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { DonateItemRow } from "@/components/donate/donate-item-row";
import { DonateSummaryBar } from "@/components/donate/donate-summary-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { draftTotals, type DonationDraftLine, type DonationPrefill } from "@/lib/donate/prefill";
import { monthLabel } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import type { RationItemId } from "@/lib/ration/catalog";

type DonatePickerProps = {
  prefill: DonationPrefill;
  /** Stores the pledge; rejects when the store refused. */
  onPledge: (month: string, lines: DonationDraftLine[]) => Promise<void>;
};

const at = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * The surplus of the saved plan, one stepper per item with something to give, and the sticky pledge bar.
 * Without a plan for the month: a nudge to make one first, then a manual pick below it.
 */
export function DonatePicker({ prefill, onPledge }: DonatePickerProps) {
  const { t, locale } = useLanguage();
  const [qtys, setQtys] = useState<Partial<Record<RationItemId, number>>>({});
  const [pledging, setPledging] = useState(false);
  const [error, setError] = useState(false);

  const lines = useMemo(
    () => prefill.lines.map((line) => ({ ...line, qty: qtys[line.item.id] ?? line.qty })),
    [prefill.lines, qtys],
  );
  // Items already pledged in full stay out of the way.
  const visible = lines.filter((line) => line.maxQty > 0);
  const totals = useMemo(() => draftTotals(lines), [lines]);
  const month = monthLabel(prefill.month, locale);
  const fromPlan = prefill.source === "plan";
  // The header takes one stagger slot with a plan, two without (card + "or pick" line).
  const firstRow = fromPlan ? 1 : 2;

  const pledge = async () => {
    if (pledging || totals.count === 0) return;
    setPledging(true);
    setError(false);
    try {
      await onPledge(prefill.month, lines.filter((line) => line.qty > 0));
    } catch {
      setError(true);
    } finally {
      setPledging(false);
    }
  };

  return (
    <div className="stagger flex flex-col gap-3">
      {fromPlan ? (
        <div style={at(0)} className="flex flex-col gap-1.5">
          <span className="tabular inline-flex w-fit items-center gap-1.5 rounded-full bg-warm/15 px-3 py-1 text-xs font-medium text-warm-ink">
            <HeartHandshake className="size-3.5 shrink-0" aria-hidden="true" />
            <bdi>{t("pages.donate.picker.fromPlanFor", { month })}</bdi>
          </span>
          <p className="text-xs text-muted-foreground">{t("pages.donate.picker.fromPlan")}</p>
        </div>
      ) : (
        <>
          <Card style={at(0)}>
            <CardContent>
              <EmptyState
                icon={ClipboardList}
                title={t("pages.donate.picker.noPlanTitle")}
                className="py-4"
                action={
                  <Button nativeButton={false} size="lg" className="pressable h-11 rounded-xl px-5" render={<Link href="/plan" />}>
                    {t("pages.donate.picker.noPlanAction")}
                  </Button>
                }
              />
            </CardContent>
          </Card>
          <p style={at(1)} className="mt-1 text-xs font-medium text-muted-foreground">
            {t("pages.donate.picker.orPick")}
          </p>
        </>
      )}

      {visible.length === 0 ? (
        <Card style={at(firstRow)}>
          <CardContent className="text-center text-sm text-muted-foreground">
            <bdi>{t("pages.donate.picker.allPledged", { month })}</bdi>
          </CardContent>
        </Card>
      ) : (
        visible.map((line, i) => (
          <DonateItemRow
            key={line.item.id}
            line={line}
            disabled={pledging}
            onChange={(qty) => setQtys((q) => ({ ...q, [line.item.id]: qty }))}
            style={at(Math.min(i + firstRow, 7))}
          />
        ))
      )}

      {fromPlan ? (
        <Link
          href="/plan"
          style={at(Math.min(visible.length + firstRow, 8))}
          className="pressable self-center rounded-lg px-3 py-2.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("pages.donate.picker.changePlan")}
        </Link>
      ) : null}

      {visible.length > 0 ? (
        // Direct child of the flex column: a sticky element can only stick within its parent.
        <DonateSummaryBar
          style={at(Math.min(visible.length + firstRow, 8))}
          className="mt-1"
          totals={totals}
          pledging={pledging}
          error={error}
          onPledge={pledge}
        />
      ) : null}
    </div>
  );
}
