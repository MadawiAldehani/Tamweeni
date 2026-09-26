"use client";

import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Donation, Household } from "@/lib/data/types";
import { buildPickupMessage, whatsappUrl } from "@/lib/donate/whatsapp";
import { voucherLines } from "@/lib/donate/voucher";
import { monthLabel } from "@/lib/format";
import { localized, useLanguage } from "@/lib/i18n/provider";
import { GOVERNORATES } from "@/lib/ration/governorates";

type WhatsAppPickupButtonProps = {
  code: string;
  donations: Donation[];
  household: Household;
};

/** Opens WhatsApp with the pledge details prefilled; the family picks who to send it to. */
export function WhatsAppPickupButton({ code, donations, household }: WhatsAppPickupButtonProps) {
  const { t, locale } = useLanguage();
  const governorate = GOVERNORATES.find((g) => g.id === household.governorate);
  const month = donations[0]?.month;
  const text = buildPickupMessage(locale, t, {
    code,
    householdName: household.name,
    governorate: governorate ? localized(governorate, "name", locale) : "",
    coopName: household.coop_name,
    monthLabel: month ? monthLabel(month, locale) : "",
    lines: voucherLines(donations, locale, t),
  });

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        nativeButton={false}
        variant="secondary"
        size="lg"
        className="pressable h-12 w-full rounded-xl text-base"
        render={<a href={whatsappUrl(text)} target="_blank" rel="noopener noreferrer" />}
      >
        <MessageCircle aria-hidden="true" />
        {t("pages.donate.whatsapp.button")}
      </Button>
      <p className="text-center text-xs text-muted-foreground">{t("pages.donate.whatsapp.caption")}</p>
    </div>
  );
}
