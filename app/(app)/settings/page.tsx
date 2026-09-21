"use client";

import { Settings } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { LangToggle } from "@/components/common/lang-toggle";
import { AppHeader } from "@/components/shell/app-header";
import { PageContainer } from "@/components/shell/page-container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/lib/i18n/provider";

export default function SettingsPage() {
  const t = useT();

  return (
    <>
      <AppHeader title={t("pages.settings.title")} action={<LangToggle />} />
      <PageContainer className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <Badge variant="secondary" className="self-start">
              {t("common.comingSoon")}
            </Badge>
            <EmptyState
              icon={Settings}
              title={t("pages.settings.placeholder")}
              className="py-6"
            />
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
