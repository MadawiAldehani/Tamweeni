"use client";

import type { CSSProperties } from "react";

import { AboutCard } from "@/components/settings/about-card";
import { DataCard } from "@/components/settings/data-card";
import { HouseholdCard } from "@/components/settings/household-card";
import { LanguageCard } from "@/components/settings/language-card";
import { MembersCard } from "@/components/settings/members-card";
import { AppHeader } from "@/components/shell/app-header";
import { PageContainer } from "@/components/shell/page-container";
import { useT } from "@/lib/i18n/provider";

const at = (i: number) => ({ "--i": i }) as CSSProperties;

export default function SettingsPage() {
  const t = useT();

  return (
    <>
      <AppHeader title={t("pages.settings.title")} />
      <PageContainer className="stagger flex flex-col gap-4">
        <div style={at(0)}>
          <LanguageCard />
        </div>
        <div style={at(1)}>
          <HouseholdCard />
        </div>
        <div style={at(2)}>
          <MembersCard />
        </div>
        <div style={at(3)}>
          <DataCard />
        </div>
        <div style={at(4)}>
          <AboutCard />
        </div>
      </PageContainer>
    </>
  );
}
