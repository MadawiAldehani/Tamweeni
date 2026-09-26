"use client";

import { CheckCircle2, Plus, ScanSearch } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";

import { ReceiptMeta } from "@/components/scan/receipt-meta";
import { ReviewLine } from "@/components/scan/review-line";
import { ReviewSummary } from "@/components/scan/review-summary";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/data/provider";
import { todayISO } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import { averageConfidence } from "@/lib/receipt/parse-client";
import {
  blankLine,
  isInvalid,
  isSavable,
  pickupSourceFor,
  reviewTotals,
  toPickupLines,
  type ReviewLine as ReviewLineModel,
  type ReviewSource,
  type ReviewTotals,
} from "@/lib/receipt/review";
import type { ParsedReceipt } from "@/lib/receipt/types";

type ReviewStepProps = {
  /** The parse as it came in; its confidences feed ai_confidence on the saved pickup. */
  receipt: ParsedReceipt;
  initialLines: ReviewLineModel[];
  source: ReviewSource;
  file: Blob | null;
  onSaved: (totals: ReviewTotals) => void;
};

const at = (i: number) => ({ "--i": i }) as CSSProperties;

/** Step 3: the family corrects store, date and every line, then saves the pickup. */
export function ReviewStep({ receipt, initialLines, source, file, onSaved }: ReviewStepProps) {
  const t = useT();
  const { mutate } = useData();
  const [store, setStore] = useState(receipt.store ?? "");
  const [date, setDate] = useState(receipt.date ?? todayISO());
  const [lines, setLines] = useState(initialLines);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const totals = useMemo(() => reviewTotals(lines), [lines]);
  const savable = isSavable(lines) && /^\d{4}-\d{2}-\d{2}$/.test(date);
  const nothingRead = source !== "manual" && receipt.lines.length === 0;
  const allCollected = source === "manual" && initialLines.length === 0;
  const hint = lines.some(isInvalid)
    ? t("pages.scan.review.fixHint")
    : totals.count === 0
      ? t("pages.scan.review.noLinesHint")
      : null;

  const update = (next: ReviewLineModel) => setLines((all) => all.map((l) => (l.id === next.id ? next : l)));
  const remove = (id: string) => setLines((all) => all.filter((l) => l.id !== id));
  const addLine = () => {
    const line = blankLine();
    setLines((all) => [...all, line]);
    setFocusId(line.id);
  };

  const save = async () => {
    if (!savable || saving) return;
    setSaving(true);
    setError(false);
    try {
      await mutate((s) =>
        s.createPickup({
          month: date.slice(0, 7),
          pickup_date: date,
          source: pickupSourceFor(source),
          lines: toPickupLines(lines),
          receipt_image: file,
          ai_confidence: source === "manual" ? null : averageConfidence(receipt.lines),
        }),
      );
      onSaved(totals);
    } catch {
      setError(true);
      setSaving(false);
    }
  };

  return (
    <div className="stagger flex flex-col gap-3">
      {nothingRead ? (
        <Alert style={at(0)} className="border-warning/40 bg-warning/10 text-foreground">
          <ScanSearch className="text-warning" aria-hidden="true" />
          <AlertDescription className="text-foreground">{t("pages.scan.review.empty")}</AlertDescription>
        </Alert>
      ) : null}
      {allCollected ? (
        <Alert style={at(0)} className="border-primary/30 bg-primary/5 text-foreground">
          <CheckCircle2 className="text-primary" aria-hidden="true" />
          <AlertDescription className="text-foreground">{t("pages.scan.review.allCollected")}</AlertDescription>
        </Alert>
      ) : null}

      <div style={at(0.5)}>
        <ReceiptMeta source={source} store={store} date={date} onStoreChange={setStore} onDateChange={setDate} />
      </div>

      {lines.map((line, i) => (
        <ReviewLine
          key={line.id}
          line={line}
          index={Math.min(i + 1, 6)}
          autoFocus={line.id === focusId}
          onChange={update}
          onRemove={() => remove(line.id)}
        />
      ))}

      <Button
        style={at(Math.min(lines.length + 1, 7))}
        variant="outline"
        size="lg"
        className="pressable h-12 rounded-xl border-dashed text-base"
        onClick={addLine}
      >
        <Plus aria-hidden="true" />
        {t("pages.scan.review.addLine")}
      </Button>

      {/* Direct child of the flex column: a sticky element can only stick within its parent. */}
      <ReviewSummary
        style={at(Math.min(lines.length + 2, 8))}
        className="mt-1"
        totals={totals}
        savable={savable}
        saving={saving}
        error={error}
        hint={hint}
        onSave={save}
      />
    </div>
  );
}
