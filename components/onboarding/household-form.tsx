"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FieldError } from "@/components/onboarding/field-error";
import { EntitlementPreview } from "@/components/onboarding/entitlement-preview";
import { MembersEditor, type MemberDraft } from "@/components/onboarding/members-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/lib/data/provider";
import { useLanguage } from "@/lib/i18n/provider";
import { localized } from "@/lib/i18n/translate";
import { fieldErrors, householdSchema, type FieldErrors } from "@/lib/onboarding/household-schema";
import { GOVERNORATES, type Governorate } from "@/lib/ration/governorates";

/** Onboarding step 3: the household form. Saves and opens the dashboard. */
export function HouseholdForm({ onBack }: { onBack: () => void }) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const { mutate } = useData();
  const [name, setName] = useState("");
  const [governorate, setGovernorate] = useState<Governorate | null>(null);
  const [coop, setCoop] = useState("");
  const [members, setMembers] = useState<MemberDraft[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const items = GOVERNORATES.map((g) => ({ value: g.id, label: localized(g, "name", locale) }));
  const describedBy = (field: string) => (errors[field] ? `household-${field}-error` : undefined);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    // Untouched blank rows from the editor are not members; a named or infant row is.
    const filled = members.filter((m) => m.name.trim() || m.is_infant);
    const parsed = householdSchema.safeParse({ name, governorate, coop_name: coop, members: filled });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error.issues));
    setErrors({});
    setFailed(false);
    setBusy(true);
    try {
      await mutate((s) => s.createHousehold(parsed.data));
      router.replace("/home");
    } catch {
      setFailed(true);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{t("pages.onboarding.household.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("pages.onboarding.household.subtitle")}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="household-name">{t("pages.onboarding.household.nameLabel")}</Label>
        <Input
          id="household-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("pages.onboarding.household.namePlaceholder")}
          autoComplete="off"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy("name")}
          className="h-11 rounded-lg bg-card"
        />
        <FieldError id="household-name-error" message={errors.name && t(errors.name)} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="household-governorate">{t("pages.onboarding.household.governorateLabel")}</Label>
        <Select items={items} value={governorate} onValueChange={(value) => setGovernorate(value as Governorate | null)}>
          <SelectTrigger
            id="household-governorate"
            aria-invalid={errors.governorate ? true : undefined}
            aria-describedby={describedBy("governorate")}
            className="h-11 w-full rounded-lg bg-card"
          >
            <SelectValue placeholder={t("pages.onboarding.household.governoratePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value} className="py-2">
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError id="household-governorate-error" message={errors.governorate && t(errors.governorate)} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="household-coop">{t("pages.onboarding.household.coopLabel")}</Label>
        <Input
          id="household-coop"
          value={coop}
          onChange={(e) => setCoop(e.target.value)}
          placeholder={t("pages.onboarding.household.coopPlaceholder")}
          autoComplete="off"
          aria-invalid={errors.coop_name ? true : undefined}
          aria-describedby={describedBy("coop_name")}
          className="h-11 rounded-lg bg-card"
        />
        <FieldError id="household-coop_name-error" message={errors.coop_name && t(errors.coop_name)} />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">{t("pages.onboarding.household.membersLabel")}</p>
        <p className="text-sm text-muted-foreground">{t("pages.onboarding.household.membersHint")}</p>
        <MembersEditor members={members} onChange={setMembers} />
        <FieldError id="household-members-error" message={errors.members && t(errors.members)} />
      </div>

      <EntitlementPreview members={members} />

      {failed ? (
        <p role="alert" className="text-sm text-destructive">{t("pages.onboarding.household.saveFailed")}</p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button type="submit" size="lg" disabled={busy} className="pressable h-12 w-full rounded-xl text-base">
          {busy ? t("pages.onboarding.household.saving") : t("pages.onboarding.household.save")}
        </Button>
        <Button type="button" variant="ghost" size="lg" disabled={busy} onClick={onBack} className="h-12 w-full rounded-xl text-base">
          {t("pages.onboarding.back")}
        </Button>
      </div>
    </form>
  );
}
