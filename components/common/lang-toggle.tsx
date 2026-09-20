"use client";

import { useLanguage, useT } from "@/lib/i18n/provider";
import { locales, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const shortLabel: Record<Locale, "language.shortEn" | "language.shortAr"> = {
  en: "language.shortEn",
  ar: "language.shortAr",
};

/** Small segmented pill: EN | ع. */
export function LangToggle({ className }: { className?: string }) {
  const t = useT();
  const { locale, setLocale } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t("language.label")}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full bg-muted p-1",
        className,
      )}
    >
      {locales.map((option) => {
        const active = option === locale;
        return (
          <button
            key={option}
            type="button"
            lang={option}
            aria-pressed={active}
            onClick={() => setLocale(option)}
            className={cn(
              "min-h-9 min-w-11 rounded-full px-3 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(shortLabel[option])}
          </button>
        );
      })}
    </div>
  );
}
