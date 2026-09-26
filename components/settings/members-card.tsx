"use client";

import { Baby } from "lucide-react";
import { useState } from "react";
import { MembersEditor, type MemberDraft } from "@/components/onboarding/members-editor";
import { InlineNote, useFlash } from "@/components/settings/inline-note";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useData } from "@/lib/data/provider";
import { formatKD } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import { monthlySubsidyKD } from "@/lib/ration/entitlement";

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "•";
}

export function MembersCard() {
  const { t, locale } = useLanguage();
  const { snapshot, mutate } = useData();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<MemberDraft[]>([]);
  const [note, flash] = useFlash(6000);

  const members = snapshot.members;
  const countLabel =
    members.length === 1
      ? t("pages.settings.members.countOne")
      : t("pages.settings.members.count", { count: members.length });

  const openEditor = () => {
    setDrafts(members.map((m) => ({ id: m.id, name: m.name, is_infant: m.is_infant })));
    setOpen(true);
  };

  const cleaned = drafts.map((d) => ({ ...d, name: d.name.trim() })).filter((d) => d.name.length > 0);
  const canSave = cleaned.length > 0 && !busy;

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    try {
      await mutate((s) => s.setMembers(cleaned));
      const kd = monthlySubsidyKD(
        cleaned.map((d, i) => ({ id: d.id ?? `draft-${i}`, household_id: "", name: d.name, is_infant: d.is_infant })),
      );
      setOpen(false);
      flash(t("pages.settings.members.saved", { kd: formatKD(kd, locale) }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pages.settings.members.title")}</CardTitle>
        <CardDescription>
          <bdi>{countLabel}</bdi>
        </CardDescription>
        <CardAction>
          <Button type="button" variant="outline" onClick={openEditor} className="pressable h-10 rounded-lg px-4">
            {t("pages.settings.members.edit")}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("pages.settings.members.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {members.map((member) => (
              <li key={member.id} className="flex min-h-11 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                  {initialOf(member.name)}
                </span>
                <span className="min-w-0 flex-1 truncate text-base">{member.name}</span>
                {member.is_infant ? (
                  <Badge variant="secondary">
                    <Baby aria-hidden="true" />
                    {t("pages.settings.members.infant")}
                  </Badge>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <InlineNote message={note} />
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("pages.settings.members.dialogTitle")}</DialogTitle>
            <DialogDescription>{t("pages.settings.members.dialogHint")}</DialogDescription>
          </DialogHeader>
          <MembersEditor members={drafts} onChange={setDrafts} />
          <DialogFooter className="flex-col">
            <Button type="button" size="lg" disabled={!canSave} onClick={() => void save()} className="pressable h-12 w-full rounded-xl text-base">
              {busy ? t("pages.settings.data.working") : t("common.save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={busy}
              onClick={() => setOpen(false)}
              className="h-12 w-full rounded-xl text-base"
            >
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
