"use client";

import Link from "next/link";
import { Camera, ClipboardList, HeartHandshake, type LucideIcon } from "lucide-react";
import { LangToggle } from "@/components/common/lang-toggle";
import { AppHeader } from "@/components/shell/app-header";
import { PageContainer } from "@/components/shell/page-container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatKD } from "@/lib/format";
import { useLanguage, useT } from "@/lib/i18n/provider";
import type { TKey } from "@/lib/i18n/provider";

type Action = { href: string; labelKey: TKey; icon: LucideIcon };

const actions: Action[] = [
  { href: "/scan", labelKey: "pages.home.actions.scan", icon: Camera },
  { href: "/plan", labelKey: "pages.home.actions.plan", icon: ClipboardList },
  { href: "/donate", labelKey: "pages.home.actions.donate", icon: HeartHandshake },
];

export default function HomePage() {
  const t = useT();
  const { locale } = useLanguage();

  return (
    <>
      <AppHeader title={t("pages.home.title")} showLogo action={<LangToggle />} />
      <PageContainer className="flex flex-col gap-4">
        <Card className="bg-primary text-primary-foreground ring-0">
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm text-primary-foreground/80">{t("pages.home.greeting")}</p>
            <p className="tabular text-4xl font-semibold">{formatKD(0, locale)}</p>
            <p className="text-sm text-primary-foreground/80">
              {t("pages.home.subsidyCaption")}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          {actions.map(({ href, labelKey, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl bg-card px-2 text-center ring-1 ring-foreground/10 transition-colors hover:bg-accent"
            >
              <Icon className="size-6 text-primary" aria-hidden="true" />
              <span className="text-xs font-medium leading-tight">{t(labelKey)}</span>
            </Link>
          ))}
        </div>

        <Card>
          <CardContent className="flex flex-col items-start gap-3">
            <Badge variant="secondary">{t("common.comingSoon")}</Badge>
            <p className="text-muted-foreground">{t("pages.home.placeholder")}</p>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
