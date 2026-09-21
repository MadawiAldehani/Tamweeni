"use client";

import { Check } from "lucide-react";
import { locales, type Locale } from "@/lib/i18n/config";
import { useLanguage, useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

/** Order is fixed (en, ar) so the cards never jump around based on the browser language. */
const cards: Record<Locale, { nameKey: "language.english" | "language.arabic"; sampleKey: "pages.onboarding.sampleEn" | "pages.onboarding.sampleAr" }> = {
  en: { nameKey: "language.english", sampleKey: "pages.onboarding.sampleEn" },
  ar: { nameKey: "language.arabic", sampleKey: "pages.onboarding.sampleAr" },
};

/** Two large language cards; the chosen one fills green. Each card speaks its own language. */
export function LanguageCards() {
  const t = useT();
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-sm font-medium text-muted-foreground">{t("pages.onboarding.chooseLanguage")}</p>
      <div className="grid grid-cols-2 gap-3">
        {locales.map((option) => {
          const selected = option === locale;
          const isArabic = option === "ar";
          return (
            <button
              key={option}
              type="button"
              lang={option}
              aria-pressed={selected}
              onClick={() => setLocale(option)}
              className={cn(
                "pressable relative flex h-[88px] flex-col items-center justify-center gap-1 rounded-2xl bg-card ring-1 ring-foreground/10 transition-colors",
                selected && "bg-primary text-primary-foreground ring-primary",
              )}
            >
              <span className={cn("text-lg font-semibold", isArabic && "font-ar")}>{t(cards[option].nameKey)}</span>
              <span className={cn("text-xs", selected ? "text-white/75" : "text-muted-foreground", isArabic && "font-ar")}>
                {t(cards[option].sampleKey)}
              </span>
              {selected && (
                <span className="absolute top-2 end-2 flex size-5 animate-in zoom-in-50 items-center justify-center rounded-full bg-white duration-200">
                  <Check className="size-3 text-primary" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
