"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

import { LangToggle } from "@/components/common/lang-toggle";
import { Logo } from "@/components/common/logo";
import { GovernorateList } from "@/components/impact/governorate-list";
import { ImpactHero } from "@/components/impact/impact-hero";
import { ImpactLedger } from "@/components/impact/impact-ledger";
import { MethodNote } from "@/components/impact/method-note";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";

const at = (i: number) => ({ "--i": i } as CSSProperties);

/** Public, editorial page for judges and the ministry. No bottom nav, no auth. */
export default function ImpactPage() {
  const t = useT();

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
        <ImpactHero />

        <div style={at(2)}>
          <ImpactLedger />
        </div>

        <div style={at(3)}>
          <GovernorateList />
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
