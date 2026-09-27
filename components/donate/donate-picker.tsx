"use client";

import { HeartHandshake } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";

import { DonateItemRow } from "@/components/donate/donate-item-row";
import { DonateSummaryBar } from "@/components/donate/donate-summary-bar";
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

const SOURCE_LINE = {
  plan: "pages.donate.picker.fromPlan",
  suggestion: "pages.donate.picker.fromSuggestion",
  none: "pages.donate.picker.fromNone",
} as const;

/** The surplus chip, one stepper per item with something to give, and the sticky pledge bar. */
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
      <div style={at(0)} className="flex flex-col gap-1.5">
        <span className="tabular inline-flex w-fit items-center gap-1.5 rounded-full bg-warm/15 px-3 py-1 text-xs font-medium text-warm-ink">
          <HeartHandshake className="size-3.5 shrink-0" aria-hidden="true" />
          <bdi>{t("pages.donate.picker.surplusFor", { month })}</bdi>
        </span>
        <p className="text-xs text-muted-foreground">{t(SOURCE_LINE[prefill.source])}</p>
      </div>

      {visible.length === 0 ? (
        <Card style={at(1)}>
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
            style={at(Math.min(i + 1, 7))}
          />
        ))
      )}

      <Link
        href="/plan"
        style={at(Math.min(visible.length + 1, 8))}
        className="pressable self-center rounded-lg px-3 py-2.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {t("pages.donate.picker.adjustPlan")}
      </Link>

      {visible.length > 0 ? (
        // Direct child of the flex column: a sticky element can only stick within its parent.
        <DonateSummaryBar
          style={at(Math.min(visible.length + 1, 8))}
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
