"use client";

import { ChartColumn } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { AppHeader } from "@/components/shell/app-header";
import { PageContainer } from "@/components/shell/page-container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/lib/i18n/provider";

export default function InsightsPage() {
  const t = useT();

  return (
    <>
      <AppHeader title={t("pages.insights.title")} subtitle={t("pages.insights.subtitle")} />
      <PageContainer className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <Badge variant="secondary" className="self-start">
              {t("common.comingSoon")}
            </Badge>
            <EmptyState
              icon={ChartColumn}
              title={t("pages.insights.placeholder")}
              className="py-6"
            />
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
