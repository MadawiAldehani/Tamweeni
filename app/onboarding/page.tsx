"use client";

import Link from "next/link";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { locales, type Locale } from "@/lib/i18n/config";
import { useLanguage, useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const languageLabel: Record<Locale, "language.english" | "language.arabic"> = {
  en: "language.english",
  ar: "language.arabic",
};

export default function OnboardingPage() {
  const t = useT();
  const { locale, setLocale } = useLanguage();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-between px-6 pt-16 pb-10">
      <div className="flex flex-col items-center gap-6 text-center">
        <Logo size="lg" />
        <p className="text-lg text-muted-foreground">{t("app.tagline")}</p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-center text-sm font-medium text-muted-foreground">
            {t("pages.onboarding.chooseLanguage")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {locales.map((option) => {
              const active = option === locale;
              return (
                <Button
                  key={option}
                  variant="outline"
                  size="lg"
                  lang={option}
                  aria-pressed={active}
                  onClick={() => setLocale(option)}
                  className={cn(
                    "h-14 rounded-xl text-base",
                    active &&
                      "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                  )}
                >
                  {t(languageLabel[option])}
                </Button>
              );
            })}
          </div>
        </div>

        <Button
          nativeButton={false}
          size="lg"
          className="h-12 w-full rounded-xl text-base"
          render={<Link href="/home" />}
        >
          {t("common.continue")}
        </Button>
      </div>
    </main>
  );
}
