"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { LangToggle } from "@/components/common/lang-toggle";
import { InsightCard } from "@/components/home/insight-card";
import { MonthHeroCard } from "@/components/home/month-hero-card";
import { PantryPromptCard } from "@/components/home/pantry-prompt-card";
import { PantryShelf } from "@/components/home/pantry-shelf";
import { QuickActions } from "@/components/home/quick-actions";
import { SadaqaCounter } from "@/components/home/sadaqa-counter";
import { AppHeader } from "@/components/shell/app-header";
import { PageContainer } from "@/components/shell/page-container";
import { useSnapshot } from "@/lib/data/provider";
import { currentMonth } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import { hasPickupIn } from "@/lib/plan/month";
import { monthSummary, quantityTotals } from "@/lib/ration/entitlement";
import { nextStep as pickNextStep } from "@/lib/ration/insights";

const at = (i: number) => ({ "--i": i }) as CSSProperties;

export default function HomePage() {
  const t = useT();
  const snapshot = useSnapshot();
  // Time-of-day state fills in after mount so server and client render the same markup.
  const [now, setNow] = useState<Date | null>(null);
  const [ringValue, setRingValue] = useState(0);

  const month = currentMonth(now ?? undefined);
  const summary = useMemo(
    () => monthSummary(snapshot.members, snapshot.pickups, month),
    [snapshot.members, snapshot.pickups, month],
  );
  const nextStep = useMemo(() => pickNextStep(snapshot, now ?? new Date()), [snapshot, now]);
  const qty = quantityTotals(summary.items);
  const collectedShare = qty.entitledKg ? qty.collectedKg / qty.entitledKg : 0;

  useEffect(() => {
    setNow(new Date());
  }, []);

  // The ring sweeps in after mount and again whenever the snapshot changes the share.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setRingValue(collectedShare);
      return;
    }
    const timer = window.setTimeout(() => setRingValue(collectedShare), 150);
    return () => window.clearTimeout(timer);
  }, [collectedShare]);

  return (
    <>
      <AppHeader title={t("pages.home.title")} showLogo action={<LangToggle />} />
      <PageContainer className="stagger flex flex-col gap-4">
        <div style={at(0)}>
          <MonthHeroCard summary={summary} now={now} household={snapshot.household} ringValue={ringValue} />
        </div>
        <div style={at(1)}>
          <InsightCard snapshot={snapshot} now={now} />
        </div>
        <PantryPromptCard style={at(1.5)} />
        <div style={at(2)}>
          <PantryShelf summary={summary} memberCount={snapshot.members.length} />
        </div>
        <div style={at(3)}>
          <QuickActions nextStep={nextStep} checkinReady={hasPickupIn(snapshot.pickups, month)} />
        </div>
        {/* Only once leftovers were actually given: giving is optional, never the goal. */}
        {snapshot.donations.length > 0 ? (
          <div style={at(4)}>
            <SadaqaCounter donations={snapshot.donations} />
          </div>
        ) : null}
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
