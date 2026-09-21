"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";

const at = (i: number) => ({ "--i": i }) as CSSProperties;

export default function NotFound() {
  const t = useT();

  return (
    <main className="stagger mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <span style={at(0)} aria-hidden className="flex size-[88px] items-center justify-center rounded-full bg-secondary/60 text-5xl">
        🧺
      </span>
      <h1 style={at(1)} className="text-2xl font-semibold">
        {t("pages.notFound.title")}
      </h1>
      <p style={at(2)} className="text-sm text-muted-foreground">
        {t("pages.notFound.description")}
      </p>
      <Button
        style={at(3)}
        nativeButton={false}
        size="lg"
        className="pressable h-12 rounded-2xl px-6 text-base"
        render={<Link href="/home" />}
      >
        {t("pages.notFound.home")}
      </Button>
    </main>
  );
}
