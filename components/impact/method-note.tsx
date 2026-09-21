"use client";

import { useT } from "@/lib/i18n/provider";

/** Methodology a ministry official would respect, plus the page's single warm (sadaqa) touch. */
export function MethodNote() {
  const t = useT();

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-dashed border-foreground/20 p-5">
      <h2 className="text-sm font-semibold">{t("pages.impact.method.title")}</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">{t("pages.impact.method.body")}</p>
      <p className="text-sm font-medium">{t("pages.impact.method.request")}</p>
      <p className="flex items-center gap-2 text-sm">
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-warm/15 text-base"
        >
          🤲
        </span>
        {t("pages.impact.foodBankLine")}
      </p>
    </section>
  );
}
