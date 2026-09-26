"use client";

import { Home, MapPin, Store } from "lucide-react";
import { useState, type ReactNode } from "react";
import { HouseholdDialog, type HouseholdPatch } from "@/components/settings/household-dialog";
import { InlineNote, useFlash } from "@/components/settings/inline-note";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data/provider";
import { useLanguage } from "@/lib/i18n/provider";
import { localized } from "@/lib/i18n/translate";
import { GOVERNORATES } from "@/lib/ration/governorates";

function Row({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-base font-medium">{value}</p>
      </div>
    </div>
  );
}

export function HouseholdCard() {
  const { t, locale } = useLanguage();
  const { snapshot, mutate } = useData();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, flash] = useFlash();

  const household = snapshot.household;
  if (!household) return null;

  const governorate = GOVERNORATES.find((g) => g.id === household.governorate);
  const governorateName = governorate ? localized(governorate, "name", locale) : household.governorate;

  const save = async (patch: HouseholdPatch) => {
    setBusy(true);
    try {
      await mutate((s) => s.updateHousehold(patch));
      setOpen(false);
      flash(t("pages.settings.household.saved"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pages.settings.household.title")}</CardTitle>
        <CardAction>
          <Button type="button" variant="outline" onClick={() => setOpen(true)} className="pressable h-10 rounded-lg px-4">
            {t("pages.settings.household.edit")}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Row icon={<Home className="size-4" aria-hidden="true" />} label={t("pages.settings.household.name")} value={household.name} />
        <Row
          icon={<MapPin className="size-4" aria-hidden="true" />}
          label={t("pages.settings.household.governorate")}
          value={governorateName}
        />
        <Row
          icon={<Store className="size-4" aria-hidden="true" />}
          label={t("pages.settings.household.coop")}
          value={household.coop_name}
        />
        <InlineNote message={note} />
      </CardContent>
      <HouseholdDialog open={open} onOpenChange={setOpen} household={household} busy={busy} onSave={save} />
    </Card>
  );
}
