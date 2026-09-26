"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/lib/i18n/provider";

export type MemberDraft = { id?: string; name: string; is_infant: boolean };

const blank = (): MemberDraft => ({ name: "", is_infant: false });

type MembersEditorProps = {
  members: MemberDraft[];
  onChange: (members: MemberDraft[]) => void;
};

/** Editable list of household members. Shared by onboarding and Settings; keeps ids when present. */
export function MembersEditor({ members, onChange }: MembersEditorProps) {
  const t = useT();
  const seeded = useRef(false);

  // An empty list starts with two rows so the form never looks blank.
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    if (members.length === 0) onChange([blank(), blank()]);
  }, [members.length, onChange]);

  const update = (index: number, patch: Partial<MemberDraft>) =>
    onChange(members.map((m, i) => (i === index ? { ...m, ...patch } : m)));

  const remove = (index: number) => onChange(members.filter((_, i) => i !== index));

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {members.map((member, index) => {
          const name = member.name.trim();
          return (
            <li
              key={member.id ?? index}
              className="flex flex-col gap-2 rounded-xl bg-muted/50 p-3 animate-in fade-in duration-300"
            >
              <div className="flex items-center gap-2">
                <Input
                  value={member.name}
                  onChange={(e) => update(index, { name: e.target.value })}
                  placeholder={t("pages.onboarding.members.namePlaceholder")}
                  aria-label={t("pages.onboarding.members.nameLabel", { n: index + 1 })}
                  autoComplete="off"
                  className="h-11 flex-1 rounded-lg bg-card"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={
                    name
                      ? t("pages.onboarding.members.remove", { name })
                      : t("pages.onboarding.members.removeUnnamed")
                  }
                  onClick={() => remove(index)}
                  className="size-11 shrink-0 rounded-lg text-muted-foreground"
                >
                  <X className="size-5" />
                </Button>
              </div>
              <label className="flex min-h-11 w-fit cursor-pointer items-center gap-3 ps-1 text-sm text-foreground">
                <Switch
                  checked={member.is_infant}
                  onCheckedChange={(checked) => update(index, { is_infant: checked })}
                />
                <span>{t("pages.onboarding.members.infant")}</span>
              </label>
            </li>
          );
        })}
      </ul>

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => onChange([...members, blank()])}
        className="pressable h-12 w-full rounded-xl text-base"
      >
        <Plus data-icon="inline-start" className="size-5" />
        {t("pages.onboarding.members.add")}
      </Button>
    </div>
  );
}
