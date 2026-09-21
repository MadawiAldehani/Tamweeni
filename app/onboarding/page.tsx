"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type CSSProperties } from "react";
import { Logo } from "@/components/common/logo";
import { BEATS } from "@/components/onboarding/beats";
import { LanguageCards } from "@/components/onboarding/language-cards";
import { StepDots } from "@/components/onboarding/step-dots";
import { StoryStrip } from "@/components/onboarding/story-strip";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";

const at = (i: number) => ({ "--i": i }) as CSSProperties;

export default function OnboardingPage() {
  const t = useT();
  const listRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  const goToBeat = useCallback((index: number) => {
    const li = listRef.current?.children[index];
    li?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, []);

  return (
    <main className="stagger mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-8">
      <div style={at(0)} className="flex flex-col items-center gap-2 text-center">
        <Logo size="md" />
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {t("pages.onboarding.eyebrow")}
        </p>
      </div>

      <div style={at(1)}>
        <StoryStrip listRef={listRef} onActiveChange={setActive} />
      </div>

      <div style={at(2)}>
        <StepDots count={BEATS.length} active={active} onSelect={goToBeat} />
      </div>

      <div style={at(3)}>
        <LanguageCards />
      </div>

      <div style={at(4)} className="mt-auto">
        <Button
          nativeButton={false}
          size="lg"
          className="pressable h-12 w-full rounded-2xl text-base"
          render={<Link href="/home" />}
        >
          {t("pages.onboarding.start")}
        </Button>
      </div>
    </main>
  );
}
