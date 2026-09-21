"use client";

import { SlidersHorizontal } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { ItemIcon } from "@/components/common/item-icon";
import { AppHeader } from "@/components/shell/app-header";
import { PageContainer } from "@/components/shell/page-container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/lib/i18n/provider";
import type { RationItemId } from "@/lib/ration/catalog";

// A few shelf items so the screen hints at what it will hold.
const previewItems: RationItemId[] = ["dates", "lentils", "sugar"];

export default function PantryPage() {
  const t = useT();

  return (
    <>
      <AppHeader
        title={t("pages.pantry.title")}
        subtitle={t("pages.pantry.subtitle")}
        backHref="/home"
      />
      <PageContainer className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <Badge variant="secondary" className="self-start">
              {t("common.comingSoon")}
            </Badge>
            <div className="flex justify-center gap-2" aria-hidden="true">
              {previewItems.map((id) => (
                <ItemIcon key={id} itemId={id} size={44} className="ring-2 ring-card" />
              ))}
            </div>
            <EmptyState
              icon={SlidersHorizontal}
              title={t("pages.pantry.placeholder")}
              className="py-6"
            />
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
