"use client";

import { ScanLine } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { AppHeader } from "@/components/shell/app-header";
import { PageContainer } from "@/components/shell/page-container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/lib/i18n/provider";

export default function ScanPage() {
  const t = useT();

  return (
    <>
      <AppHeader
        title={t("pages.scan.title")}
        subtitle={t("pages.scan.subtitle")}
        backHref="/home"
      />
      <PageContainer className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <Badge variant="secondary" className="self-start">
              {t("common.comingSoon")}
            </Badge>
            <EmptyState
              icon={ScanLine}
              title={t("pages.scan.placeholder")}
              className="py-6"
            />
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
