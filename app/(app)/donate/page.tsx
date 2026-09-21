"use client";

import { EmptyState } from "@/components/common/empty-state";
import { AppHeader } from "@/components/shell/app-header";
import { PageContainer } from "@/components/shell/page-container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/lib/i18n/provider";

export default function DonatePage() {
  const t = useT();

  return (
    <>
      <AppHeader title={t("pages.donate.title")} subtitle={t("pages.donate.subtitle")} />
      <PageContainer className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <Badge variant="secondary" className="self-start">
              {t("common.comingSoon")}
            </Badge>
            {/* Terracotta is reserved for giving: the sadaqa circle. */}
            <span
              className="mx-auto flex size-14 select-none items-center justify-center rounded-full bg-warm/15 text-2xl leading-none"
              aria-hidden="true"
            >
              🤲
            </span>
            <EmptyState
              title={t("pages.donate.placeholder")}
              className="py-6"
            />
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
