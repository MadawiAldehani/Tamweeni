"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

import { ProgressRing } from "@/components/common/progress-ring";
import { useObjectUrl } from "@/components/scan/use-object-url";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/lib/i18n/provider";
import type { TKey } from "@/lib/i18n/provider";
import { sampleReceiptParse } from "@/lib/receipt/mock";
import { parseReceiptImage, type ParseProgress, type ParseStage } from "@/lib/receipt/parse-client";
import type { ParseBackend, ParsedReceipt } from "@/lib/receipt/types";

type ProcessingStepProps = {
  /** The photo to read; the sample path passes the fetched sample blob for the backdrop. */
  file: Blob | null;
  mode: "parse" | "sample";
  onDone: (receipt: ParsedReceipt, backend: ParseBackend) => void;
  onCancel: () => void;
  onUseSample: () => void;
};

const STAGE_KEY: Record<ParseStage, TKey> = {
  preparing: "pages.scan.processing.preparing",
  uploading: "pages.scan.processing.uploading",
  ai: "pages.scan.processing.ai",
  ocr: "pages.scan.processing.ocr",
  matching: "pages.scan.processing.matching",
};

const INITIAL: ParseProgress = { stage: "preparing", percent: 5 };

const SAMPLE_TIMELINE: [number, ParseProgress][] = [
  [0, { stage: "preparing", percent: 12 }],
  [500, { stage: "preparing", percent: 45 }],
  [900, { stage: "matching", percent: 80 }],
  [1250, { stage: "matching", percent: 100 }],
];
const SAMPLE_DONE_MS = 1400;

/** Step 2: blurred photo backdrop, a progress ring with the current stage, cancel, and an inline error. */
export function ProcessingStep({ file, mode, onDone, onCancel, onUseSample }: ProcessingStepProps) {
  const t = useT();
  const backdrop = useObjectUrl(file);
  const [progress, setProgress] = useState<ParseProgress>(INITIAL);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Sample timeline: independent of `file`, so the late-arriving sample blob (backdrop only)
  // never restarts the animation.
  useEffect(() => {
    if (mode !== "sample") return;
    setFailed(false);
    setProgress(INITIAL);
    const timers = SAMPLE_TIMELINE.map(([ms, p]) => setTimeout(() => setProgress(p), ms));
    timers.push(setTimeout(() => onDone(sampleReceiptParse(new Date()), "sample"), SAMPLE_DONE_MS));
    return () => timers.forEach(clearTimeout);
    // onDone is stable for the life of the page; re-running on identity changes would restart the timeline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, attempt]);

  // Real parse: Claude when configured, otherwise free on-device OCR.
  useEffect(() => {
    if (mode !== "parse" || !file) return;
    let cancelled = false;
    setFailed(false);
    setProgress(INITIAL);
    parseReceiptImage(file, (p) => {
      if (!cancelled) setProgress(p);
    })
      .then(({ receipt, backend }) => {
        if (!cancelled) onDone(receipt, backend);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // onDone is stable for the life of the page; re-running on identity changes would restart OCR.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, mode, attempt]);

  const note =
    progress.stage === "ocr" ? t("pages.scan.processing.ocrNote") : progress.stage === "ai" ? t("pages.scan.processing.aiNote") : null;

  return (
    <div className="relative -mx-4 -mt-4 min-h-[70dvh] overflow-hidden px-4 pt-10">
      {backdrop ? (
        <div aria-hidden="true" className="absolute inset-0 scale-110 bg-cover bg-center blur-xl opacity-40" style={{ backgroundImage: `url(${backdrop})` }} />
      ) : null}

      <Card className="relative animate-in fade-in zoom-in-95 duration-300 fill-mode-both shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 py-4 text-center">
          {failed ? (
            <>
              <span className="flex size-14 items-center justify-center rounded-full bg-warning/10 text-warning">
                <AlertTriangle className="size-7" aria-hidden="true" />
              </span>
              <p className="text-base font-semibold">{t("pages.scan.processing.errorTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("pages.scan.processing.errorBody")}</p>
              <div className="flex w-full flex-col gap-2 pt-1">
                <Button size="lg" className="pressable h-12 rounded-xl text-base" onClick={() => setAttempt((n) => n + 1)}>
                  {t("common.retry")}
                </Button>
                <Button size="lg" variant="outline" className="pressable h-12 rounded-xl text-base" onClick={onUseSample}>
                  {t("pages.scan.capture.useSample")}
                </Button>
                <Button variant="ghost" className="h-11 rounded-xl" onClick={onCancel}>
                  {t("common.cancel")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <ProgressRing value={progress.percent / 100} size={128} strokeWidth={10} label={t("pages.scan.processing.progressLabel")}>
                <span className="tabular text-3xl font-semibold leading-none">
                  <bdi>{Math.round(progress.percent)}%</bdi>
                </span>
              </ProgressRing>
              <p aria-live="polite" className="text-base font-medium">
                {t(STAGE_KEY[progress.stage])}
              </p>
              {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
              <Button variant="ghost" className="mt-1 h-11 rounded-xl px-4" onClick={onCancel}>
                {t("common.cancel")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
