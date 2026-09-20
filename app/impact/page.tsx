"use client";

import Link from "next/link";
import { LangToggle } from "@/components/common/lang-toggle";
import { Logo } from "@/components/common/logo";
import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/lib/i18n/provider";
import type { TKey } from "@/lib/i18n/provider";

const stats: TKey[] = [
  "pages.impact.stats.households",
  "pages.impact.stats.kgPledged",
  "pages.impact.stats.kdRedirected",
  "pages.impact.stats.overCollection",
];

export default function ImpactPage() {
  const t = useT();

  return (
    <div className="min-h-dvh">
      <header className="pt-safe sticky top-0 z-30 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3">
          <Logo size="sm" />
          <LangToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-6 pb-12">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{t("pages.impact.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("pages.impact.subtitle")}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {stats.map((key) => (
            <Card key={key}>
              <CardContent className="flex flex-col gap-1">
                <p className="tabular text-3xl font-semibold">—</p>
                <p className="text-sm text-muted-foreground">{t(key)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Link
          href="/home"
          className="self-start text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("pages.impact.backToApp")}
        </Link>
      </main>
    </div>
  );
}
