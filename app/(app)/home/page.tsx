"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";

import { LangToggle } from "@/components/common/lang-toggle";
import { InsightCard } from "@/components/home/insight-card";
import { MonthHeroCard } from "@/components/home/month-hero-card";
import { monthProgress } from "@/lib/format";
import { PantryShelf } from "@/components/home/pantry-shelf";
import { QuickActions, type NextStep } from "@/components/home/quick-actions";
import { SadaqaCounter } from "@/components/home/sadaqa-counter";
import { AppHeader } from "@/components/shell/app-header";
import { PageContainer } from "@/components/shell/page-container";
import { useT } from "@/lib/i18n/provider";

// Phase-1 placeholders. Phase 2 swaps these for the household's real figures.
const entitledKD = 0;
const collectedKD = 0;
const donatedKg = 0;
const hasReceiptThisMonth = false;

/** Next best step: scan first; once a receipt is in, plan the next pickup. */
const nextStep: NextStep = hasReceiptThisMonth ? "plan" : "scan";

const at = (i: number) => ({ "--i": i }) as CSSProperties;

export default function HomePage() {
  const t = useT();
  // Time-of-day state fills in after mount so server and client render the same markup.
  const [now, setNow] = useState<Date | null>(null);
  const [ringValue, setRingValue] = useState(0);

  useEffect(() => {
    const date = new Date();
    setNow(date);
    const target = monthProgress(date);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setRingValue(target);
      return;
    }
    const timer = window.setTimeout(() => setRingValue(target), 150);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <AppHeader title={t("pages.home.title")} showLogo action={<LangToggle />} />
      <PageContainer className="stagger flex flex-col gap-4">
        <div style={at(0)}>
          <MonthHeroCard entitledKD={entitledKD} collectedKD={collectedKD} now={now} ringValue={ringValue} />
        </div>
        <div style={at(1)}>
          <InsightCard />
        </div>
        <div style={at(2)}>
          <PantryShelf />
        </div>
        <div style={at(3)}>
          <QuickActions nextStep={nextStep} />
        </div>
        <div style={at(4)}>
          <SadaqaCounter donatedKg={donatedKg} />
        </div>
        <Link
          href="/impact"
          style={at(5)}
          className="pressable inline-flex items-center gap-1.5 self-start text-sm font-medium text-primary"
        >
          {t("pages.home.impactLink")}
          <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
        </Link>
      </PageContainer>
    </>
  );
}
