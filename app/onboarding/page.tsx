"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type CSSProperties } from "react";
import { Logo } from "@/components/common/logo";
import { BEATS } from "@/components/onboarding/beats";
import { HouseholdForm } from "@/components/onboarding/household-form";
import { LanguageCards } from "@/components/onboarding/language-cards";
import { StartStep } from "@/components/onboarding/start-step";
import { StepDots } from "@/components/onboarding/step-dots";
import { StoryStrip } from "@/components/onboarding/story-strip";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/data/provider";
import { useT } from "@/lib/i18n/provider";

const at = (i: number) => ({ "--i": i }) as CSSProperties;

type Step = "story" | "start" | "household";

export default function OnboardingPage() {
  const t = useT();
  const { snapshot } = useData();
  const listRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [step, setStep] = useState<Step>("story");

  const goToBeat = useCallback((index: number) => {
    const li = listRef.current?.children[index];
    li?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, []);

  const alreadySetUp = snapshot.household ? (
    <Link href="/home" className="pressable self-center text-sm font-medium text-primary">
      {t("pages.onboarding.alreadySetUp")}
    </Link>
  ) : null;

  if (step === "household") {
    return (
      <main key="household" className="stagger mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-8">
        <div style={at(0)} className="flex justify-center">
          <Logo size="sm" />
        </div>
        <div style={at(1)}>
          <HouseholdForm onBack={() => setStep("start")} />
        </div>
      </main>
    );
  }

  if (step === "start") {
    return (
      <main key="start" className="stagger mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-8">
        <div style={at(0)} className="flex justify-center">
          <Logo size="md" />
        </div>
        <div style={at(1)}>
          <StartStep onSetup={() => setStep("household")} />
        </div>
        <div style={at(2)} className="mt-auto flex flex-col gap-3">
          {alreadySetUp}
          <Button type="button" variant="ghost" size="lg" onClick={() => setStep("story")} className="h-12 w-full rounded-xl text-base">
            {t("pages.onboarding.back")}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main key="story" className="stagger mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-8">
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

      <div style={at(4)} className="mt-auto flex flex-col gap-3">
        {alreadySetUp}
        <Button type="button" size="lg" onClick={() => setStep("start")} className="pressable h-12 w-full rounded-2xl text-base">
          {t("common.continue")}
        </Button>
      </div>
    </main>
  );
}
