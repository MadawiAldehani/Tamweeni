"use client";

import { AppHeader } from "@/components/shell/app-header";
import { PageContainer } from "@/components/shell/page-container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/lib/i18n/provider";

export default function PantryPage() {
  const t = useT();

  return (
    <>
      <AppHeader
        title={t("pages.pantry.title")}
        subtitle={t("pages.pantry.subtitle")}
        backHref="/home"
      />
      <PageContainer>
        <Card>
          <CardContent className="flex flex-col items-start gap-3">
            <Badge variant="secondary">{t("common.comingSoon")}</Badge>
            <p className="text-muted-foreground">{t("pages.pantry.placeholder")}</p>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
