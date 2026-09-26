"use client";

import { useCallback, useRef, useState } from "react";

import { CaptureStep } from "@/components/scan/capture-step";
import { ProcessingStep } from "@/components/scan/processing-step";
import { ReviewStep } from "@/components/scan/review-step";
import { SavedStep } from "@/components/scan/saved-step";
import { AppHeader } from "@/components/shell/app-header";
import { PageContainer } from "@/components/shell/page-container";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/data/provider";
import { currentMonth } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import { monthSummary } from "@/lib/ration/entitlement";
import { fromEntitlement, toReviewLines, type ReviewLine, type ReviewSource, type ReviewTotals } from "@/lib/receipt/review";
import type { ParseBackend, ParsedReceipt } from "@/lib/receipt/types";

type Step =
  | { kind: "capture" }
  | { kind: "processing"; mode: "parse" | "sample" }
  | { kind: "review"; receipt: ParsedReceipt; lines: ReviewLine[]; source: ReviewSource; key: number }
  | { kind: "saved"; totals: ReviewTotals };

const SAMPLE_URL = "/demo/receipt-sample.jpg";

/** Scan flow: capture → processing → review → saved. The steps own their UI; this page owns the transitions. */
export default function ScanPage() {
  const t = useT();
  const { snapshot } = useData();
  const [step, setStep] = useState<Step>({ kind: "capture" });
  const [file, setFile] = useState<Blob | null>(null);
  // Bumped whenever the family leaves the sample step, so a slow sample fetch cannot land as a "picked photo".
  const sampleRequest = useRef(0);

  // `key` remounts ReviewStep so a fresh parse never inherits the previous edits.
  const toReview = useCallback((receipt: ParsedReceipt, lines: ReviewLine[], source: ReviewSource) => {
    setStep({ kind: "review", receipt, lines, source, key: Date.now() });
  }, []);

  const onParsed = useCallback(
    (receipt: ParsedReceipt, backend: ParseBackend) => toReview(receipt, toReviewLines(receipt), backend),
    [toReview],
  );

  const onFile = (chosen: Blob) => {
    sampleRequest.current += 1;
    setFile(chosen);
    setStep({ kind: "processing", mode: "parse" });
  };

  const onSample = async () => {
    const request = (sampleRequest.current += 1);
    setFile(null);
    setStep({ kind: "processing", mode: "sample" });
    try {
      const response = await fetch(SAMPLE_URL);
      if (!response.ok) return;
      const blob = await response.blob();
      // Only the backdrop and the saved receipt image need it; drop it if the family already moved on.
      if (request === sampleRequest.current) setFile(blob);
    } catch {
      /* the sample parse does not need the image; only the backdrop is missing */
    }
  };

  // Prefills only what is still outstanding this month, so a second "full quota" never double-counts.
  const onManual = () => {
    sampleRequest.current += 1;
    const summary = monthSummary(snapshot.members, snapshot.pickups, currentMonth());
    const receipt: ParsedReceipt = { store: snapshot.household?.coop_name ?? null, date: null, lines: [] };
    toReview(receipt, fromEntitlement(summary), "manual");
  };

  /** Cancel while processing: keep a real photo as "picked", but never the sample image. */
  const toCapture = (mode: "parse" | "sample") => {
    sampleRequest.current += 1;
    if (mode === "sample") setFile(null);
    setStep({ kind: "capture" });
  };

  const reset = () => {
    sampleRequest.current += 1;
    setFile(null);
    setStep({ kind: "capture" });
  };

  const header =
    step.kind === "review"
      ? { title: t("pages.scan.review.title"), subtitle: t("pages.scan.review.subtitle") }
      : step.kind === "saved"
        ? { title: t("pages.scan.saved.title"), subtitle: t("pages.scan.saved.subtitle") }
        : { title: t("pages.scan.title"), subtitle: t("pages.scan.subtitle") };

  return (
    <>
      <AppHeader
        title={header.title}
        subtitle={header.subtitle}
        backHref={step.kind === "review" ? undefined : "/home"}
        action={
          step.kind === "review" ? (
            <Button variant="ghost" className="h-11 rounded-full px-4" onClick={reset}>
              {t("pages.scan.review.retake")}
            </Button>
          ) : undefined
        }
      />
      <PageContainer>
        {step.kind === "capture" ? (
          <CaptureStep
            file={file}
            onFile={onFile}
            onParse={() => setStep({ kind: "processing", mode: "parse" })}
            onSample={onSample}
            onManual={onManual}
          />
        ) : null}

        {step.kind === "processing" ? (
          <ProcessingStep
            file={file}
            mode={step.mode}
            onDone={onParsed}
            onCancel={() => toCapture(step.mode)}
            onUseSample={onSample}
          />
        ) : null}

        {step.kind === "review" ? (
          <ReviewStep
            key={step.key}
            receipt={step.receipt}
            initialLines={step.lines}
            source={step.source}
            file={step.source === "manual" ? null : file}
            onSaved={(totals) => setStep({ kind: "saved", totals })}
          />
        ) : null}

        {step.kind === "saved" ? <SavedStep totals={step.totals} onScanAnother={reset} /> : null}
      </PageContainer>
    </>
  );
}
