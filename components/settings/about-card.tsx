"use client";

import { Logo } from "@/components/common/logo";
import { useT } from "@/lib/i18n/provider";

const APP_VERSION = "0.1.0";

export function AboutCard() {
  const t = useT();

  return (
    <section className="flex flex-col items-center gap-2 px-4 py-2 text-center">
      <Logo size="sm" />
      <p className="text-xs text-muted-foreground">
        {t("pages.settings.about.version", { version: APP_VERSION })}
      </p>
      <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
        {t("pages.settings.about.disclaimer")}
      </p>
    </section>
  );
}
