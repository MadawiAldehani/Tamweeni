"use client";

import { Check, HandHeart } from "lucide-react";

import { LogoMark } from "@/components/common/logo-mark";
import { SaduPattern } from "@/components/common/sadu-pattern";
import { VoucherQr } from "@/components/donate/voucher-qr";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { Donation, DonationStatus, Household } from "@/lib/data/types";
import { groupByVoucher, voucherLines, voucherTotals } from "@/lib/donate/voucher";
import { formatDate, formatKD, formatNumber, monthLabel } from "@/lib/format";
import { localized, useLanguage } from "@/lib/i18n/provider";
import { GOVERNORATES } from "@/lib/ration/governorates";

type VoucherCardProps = {
  code: string;
  /** The rows sharing this voucher code. */
  donations: Donation[];
  household: Household;
  status: DonationStatus;
  /** When given, shows the pilot "collected" switch. */
  onToggleStatus?: (next: DonationStatus) => void;
};

/** The pledge as a printable-feeling voucher: QR, code, family, lines, totals, instructions. */
export function VoucherCard({ code, donations, household, status, onToggleStatus }: VoucherCardProps) {
  const { t, locale } = useLanguage();
  const group = groupByVoucher(donations)[0];
  const lines = voucherLines(donations, locale, t);
  const totals = voucherTotals(donations);
  const governorate = GOVERNORATES.find((g) => g.id === household.governorate);
  const who = [household.name, governorate ? localized(governorate, "name", locale) : "", household.coop_name]
    .filter(Boolean)
    .join(" · ");
  const collected = status === "collected";

  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="flex min-w-0 items-center gap-2">
          <LogoMark size={28} />
          <span className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {t("pages.donate.voucher.eyebrow")}
          </span>
        </span>
        <Badge variant={collected ? "default" : "secondary"} className="shrink-0">
          {collected ? <Check aria-hidden="true" /> : <HandHeart aria-hidden="true" />}
          {t(collected ? "pages.donate.voucher.statusCollected" : "pages.donate.voucher.statusPledged")}
        </Badge>
      </div>
      <SaduPattern variant="band" className="h-3 text-primary/40" />

      <div className="flex flex-col items-center gap-3 px-4 pt-5 text-center">
        <VoucherQr value={code} label={t("pages.donate.voucher.qrLabel", { code })} />
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {t("pages.donate.voucher.codeLabel")}
          </span>
          <bdi dir="ltr" className="font-mono text-2xl font-semibold tracking-[0.2em]">
            {code}
          </bdi>
        </div>
        <div className="flex flex-col gap-0.5 text-sm">
          <p className="font-medium">{who}</p>
          <p className="tabular text-muted-foreground">
            <bdi>{group ? monthLabel(group.month, locale) : ""}</bdi>
            {group ? <span className="mx-1.5">·</span> : null}
            <bdi>{group ? t("pages.donate.voucher.pledgedOn", { date: formatDate(group.created_at, locale) }) : ""}</bdi>
          </p>
        </div>
      </div>

      <div className="mx-4 mt-4 border-t border-dashed border-foreground/10 pt-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {t("pages.donate.voucher.items")}
        </p>
        <ul className="divide-y divide-dashed divide-foreground/10">
          {lines.map((l) => (
            <li key={l.name} className="flex items-baseline gap-2 py-2 text-sm">
              <bdi className="tabular shrink-0 font-semibold">
                {formatNumber(l.qty, locale, 2)} {l.unit}
              </bdi>
              <span aria-hidden="true" className="text-muted-foreground">
                —
              </span>
              <span className="min-w-0 flex-1 truncate">{l.name}</span>
            </li>
          ))}
        </ul>
        <p className="tabular border-t border-dashed border-foreground/10 pt-3 text-sm font-medium text-warm-ink">
          <bdi>
            {t("pages.donate.voucher.totals", {
              kg: formatNumber(totals.kg, locale, 1),
              kd: formatKD(totals.kd, locale),
              meals: formatNumber(totals.meals, locale, 0),
            })}
          </bdi>
        </p>
      </div>

      <p className="px-4 pt-3 text-xs leading-relaxed text-muted-foreground">
        {t("pages.donate.voucher.instructions")}
      </p>

      {onToggleStatus ? (
        <label className="mx-4 mt-3 mb-4 flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2">
          <span className="flex min-w-0 flex-col">
            <span className="text-sm font-medium">{t("pages.donate.voucher.markCollected")}</span>
            <span className="text-xs text-muted-foreground">{t("pages.donate.voucher.markCollectedHint")}</span>
          </span>
          <Switch
            checked={collected}
            onCheckedChange={(checked) => onToggleStatus(checked ? "collected" : "pledged")}
          />
        </label>
      ) : (
        <div className="pb-4" />
      )}
    </Card>
  );
}
