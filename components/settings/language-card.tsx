"use client";

import { Languages } from "lucide-react";
import { LangToggle } from "@/components/common/lang-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/i18n/provider";

export function LanguageCard() {
  const t = useT();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="size-4 text-muted-foreground" aria-hidden="true" />
          {t("pages.settings.language.title")}
        </CardTitle>
        <CardDescription>{t("pages.settings.language.hint")}</CardDescription>
      </CardHeader>
      <CardContent>
        <LangToggle className="w-full justify-stretch *:flex-1" />
      </CardContent>
    </Card>
  );
}
