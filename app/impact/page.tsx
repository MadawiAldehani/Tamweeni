"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

import { LangToggle } from "@/components/common/lang-toggle";
import { Logo } from "@/components/common/logo";
import { GovernorateList } from "@/components/impact/governorate-list";
import { ImpactHero } from "@/components/impact/impact-hero";
import { ImpactLedger } from "@/components/impact/impact-ledger";
import { MethodNote } from "@/components/impact/method-note";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";
import { DEMO_IMPACT } from "@/lib/impact/demo";
import type { ImpactStats } from "@/lib/impact/types";

const at = (i: number) => ({ "--i": i } as CSSProperties);

function isImpactStats(value: unknown): value is ImpactStats {
  return typeof value === "object" && value !== null && Array.isArray((value as ImpactStats).governorates);
}

/** Public, editorial page for judges and the ministry. No bottom nav, no auth. */
export default function ImpactPage() {
  const t = useT();
  const [stats, setStats] = useState<ImpactStats | null>(null);

  // The route serves live aggregates when configured, the pilot projection otherwise;
  // any failure (offline demo, static export) falls back to the same projection here.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/impact", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: unknown) => {
        if (!cancelled) setStats(isImpactStats(json) ? json : DEMO_IMPACT);
      })
      .catch(() => {
        if (!cancelled) setStats(DEMO_IMPACT);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-dvh">
      <header className="pt-safe sticky top-0 z-30 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3">
          <Logo size="sm" />
          <LangToggle />
        </div>
      </header>

      <main className="stagger mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 pt-8 pb-16 sm:pt-12">
        {/* ImpactHero renders the eyebrow (--i 0) and headline block (--i 1). */}
        <ImpactHero stats={stats} />

        <div style={at(2)}>
          <ImpactLedger stats={stats} />
        </div>

        <div style={at(3)}>
          <GovernorateList stats={stats} />
        </div>

        <div style={at(4)}>
          <MethodNote />
        </div>

        <Button
          style={at(5)}
          nativeButton={false}
          variant="outline"
          size="lg"
          className="pressable h-11 w-fit rounded-full px-5 text-sm"
          render={<Link href="/home" />}
        >
          {t("pages.impact.backToApp")}
        </Button>
      </main>
    </div>
  );
}
