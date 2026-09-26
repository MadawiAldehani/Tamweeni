"use client";

import { useEffect, useRef, useState } from "react";
import { FieldError } from "@/components/onboarding/field-error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Household } from "@/lib/data/types";
import { useLanguage } from "@/lib/i18n/provider";
import { localized } from "@/lib/i18n/translate";
import { fieldErrors, householdFieldsSchema, type FieldErrors, type HouseholdFields } from "@/lib/onboarding/household-schema";
import { GOVERNORATES, type Governorate } from "@/lib/ration/governorates";

export type HouseholdPatch = HouseholdFields;

type HouseholdDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  household: Household;
  busy?: boolean;
  onSave: (patch: HouseholdPatch) => void | Promise<void>;
};

export function HouseholdDialog({ open, onOpenChange, household, busy = false, onSave }: HouseholdDialogProps) {
  const { t, locale } = useLanguage();
  const [name, setName] = useState(household.name);
  const [governorate, setGovernorate] = useState<Governorate>(household.governorate);
  const [coop, setCoop] = useState(household.coop_name);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Re-seed only when the dialog opens. The household lives in a ref so a snapshot refresh
  // elsewhere (every mutate() clones it) cannot wipe an edit in progress.
  const current = useRef(household);
  current.current = household;
  useEffect(() => {
    if (!open) return;
    setName(current.current.name);
    setGovernorate(current.current.governorate);
    setCoop(current.current.coop_name);
    setErrors({});
  }, [open]);

  const items = GOVERNORATES.map((g) => ({ value: g.id, label: localized(g, "name", locale) }));
  const describedBy = (field: string) => (errors[field] ? `household-${field}-error` : undefined);

  const submit = () => {
    const parsed = householdFieldsSchema.safeParse({ name, governorate, coop_name: coop });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error.issues));
    setErrors({});
    void onSave(parsed.data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("pages.settings.household.dialogTitle")}</DialogTitle>
          <DialogDescription>{t("pages.settings.household.dialogHint")}</DialogDescription>
        </DialogHeader>

        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) submit();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="household-name">{t("pages.settings.household.name")}</Label>
            <Input
              id="household-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("pages.settings.household.namePlaceholder")}
              autoComplete="off"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={describedBy("name")}
              className="h-11 rounded-lg"
            />
            <FieldError id="household-name-error" message={errors.name && t(errors.name)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="household-governorate">{t("pages.settings.household.governorate")}</Label>
            <Select
              items={items}
              value={governorate}
              onValueChange={(value) => {
                if (value) setGovernorate(value as Governorate);
              }}
            >
              <SelectTrigger
                id="household-governorate"
                aria-invalid={errors.governorate ? true : undefined}
                aria-describedby={describedBy("governorate")}
                className="h-11 w-full rounded-lg"
              >
                <SelectValue />
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
            <Label htmlFor="household-coop">{t("pages.settings.household.coop")}</Label>
            <Input
              id="household-coop"
              value={coop}
              onChange={(e) => setCoop(e.target.value)}
              placeholder={t("pages.settings.household.coopPlaceholder")}
              autoComplete="off"
              aria-invalid={errors.coop_name ? true : undefined}
              aria-describedby={describedBy("coop_name")}
              className="h-11 rounded-lg"
            />
            <FieldError id="household-coop_name-error" message={errors.coop_name && t(errors.coop_name)} />
          </div>

          <DialogFooter className="mt-2 flex-col">
            <Button type="submit" size="lg" disabled={busy} className="pressable h-12 w-full rounded-xl text-base">
              {busy ? t("pages.settings.data.working") : t("common.save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={busy}
              onClick={() => onOpenChange(false)}
              className="h-12 w-full rounded-xl text-base"
            >
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
