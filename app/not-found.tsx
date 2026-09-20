"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";

export default function NotFound() {
  const t = useT();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-2xl font-semibold">{t("pages.notFound.title")}</h1>
      <Button nativeButton={false} size="lg" className="h-12 rounded-xl px-6 text-base" render={<Link href="/home" />}>
        {t("pages.notFound.home")}
      </Button>
    </main>
  );
}
