"use client";

import { Camera, Frame, ImageUp, Sun, type LucideIcon } from "lucide-react";
import { useRef, type ChangeEvent, type CSSProperties } from "react";

import { useObjectUrl } from "@/components/scan/use-object-url";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/lib/i18n/provider";
import type { TKey } from "@/lib/i18n/provider";

type CaptureStepProps = {
  /** A photo picked earlier (kept when the family cancels processing). */
  file: Blob | null;
  onFile: (file: Blob) => void;
  onParse: () => void;
  onSample: () => void;
  onManual: () => void;
};

const TIPS: { icon: LucideIcon; key: TKey }[] = [
  { icon: Frame, key: "pages.scan.capture.tipFlat" },
  { icon: Sun, key: "pages.scan.capture.tipLight" },
  { icon: Camera, key: "pages.scan.capture.tipFrame" },
];

const at = (i: number) => ({ "--i": i }) as CSSProperties;

/** Step 1: choose a photo (camera, gallery, or the bundled sample) or skip to manual entry. */
export function CaptureStep({ file, onFile, onParse, onSample, onManual }: CaptureStepProps) {
  const t = useT();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const previewUrl = useObjectUrl(file);

  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0];
    event.target.value = ""; // allow picking the same photo again
    if (chosen) onFile(chosen);
  };

  return (
    <div className="stagger flex flex-col gap-4">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={pick} className="hidden" />
      <input ref={galleryRef} type="file" accept="image/*" onChange={pick} className="hidden" />

      <Card style={at(0)}>
        <CardContent className="flex flex-col gap-4">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- object URL of a local blob
            <img src={previewUrl} alt={t("pages.scan.capture.preview")} className="max-h-56 w-full rounded-lg bg-muted object-contain" />
          ) : (
            <div className="bg-hero relative flex h-32 items-center justify-center overflow-hidden rounded-lg text-primary-foreground">
              <Camera className="size-12 opacity-90" aria-hidden="true" />
            </div>
          )}

          <p className="text-base font-semibold">{t("pages.scan.capture.title")}</p>
          <ul className="flex flex-col gap-2">
            {TIPS.map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                  <Icon className="size-3.5" aria-hidden="true" />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 pt-1">
            {previewUrl ? (
              <Button size="lg" className="pressable h-12 rounded-xl text-base" onClick={onParse}>
                {t("pages.scan.capture.readThis")}
              </Button>
            ) : null}
            <Button
              size="lg"
              variant={previewUrl ? "secondary" : "default"}
              className="pressable h-12 rounded-xl text-base"
              onClick={() => cameraRef.current?.click()}
            >
              <Camera aria-hidden="true" />
              {t("pages.scan.capture.takePhoto")}
            </Button>
            <Button size="lg" variant="secondary" className="pressable h-12 rounded-xl text-base" onClick={() => galleryRef.current?.click()}>
              <ImageUp aria-hidden="true" />
              {t("pages.scan.capture.upload")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div style={at(1)} className="flex items-center gap-3 px-2 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("pages.scan.capture.or")}
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button style={at(2)} size="lg" variant="outline" className="pressable h-14 justify-start gap-3 rounded-xl px-3 text-base" onClick={onSample}>
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static thumbnail */}
        <img src="/demo/receipt-sample.jpg" alt={t("pages.scan.capture.sampleAlt")} className="size-9 rounded-md object-cover ring-1 ring-foreground/10" />
        {t("pages.scan.capture.useSample")}
      </Button>

      <button
        type="button"
        style={at(3)}
        onClick={onManual}
        className="min-h-11 self-center px-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {t("pages.scan.capture.manual")}
      </button>
    </div>
  );
}
