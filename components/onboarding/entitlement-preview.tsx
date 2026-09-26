"use client";

import { CountUp } from "@/components/common/count-up";
import { ItemIcon } from "@/components/common/item-icon";
import type { MemberDraft } from "@/components/onboarding/members-editor";
import type { Member } from "@/lib/data/types";
import { formatKD, formatNumber } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import { localized } from "@/lib/i18n/translate";
import { RATION_ITEMS } from "@/lib/ration/catalog";
import { entitledQty, monthlySubsidyKD, subsidyValue } from "@/lib/ration/entitlement";

/** Live "you are entitled to about KD X per month" as the member list is typed. */
export function EntitlementPreview({ members }: { members: MemberDraft[] }) {
  const { t, locale } = useLanguage();
  const named: Member[] = members
    .filter((m) => m.name.trim())
    .map((m, i) => ({ id: m.id ?? `draft-${i}`, household_id: "draft", name: m.name, is_infant: m.is_infant }));

  if (named.length === 0) {
    return (
      <p className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
        {t("pages.onboarding.entitlement.empty")}
      </p>
    );
  }

  const kd = monthlySubsidyKD(named);
  const top = RATION_ITEMS.map((item) => ({ item, qty: entitledQty(item, named) }))
    .filter((row) => row.qty > 0)
    .sort((a, b) => subsidyValue(b.item, b.qty) - subsidyValue(a.item, a.qty))
    .slice(0, 3);
  const unit = (u: "kg" | "liter" | "can") => (u === "can" ? t("units.cans") : t(`units.${u}`));

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-accent p-4 text-accent-foreground">
      <p className="text-sm">{t("pages.onboarding.entitlement.lead")}</p>
      <p className="text-3xl font-semibold tracking-tight">
        <CountUp value={kd} format={(n) => formatKD(n, locale, 0)} durationMs={600} />
      </p>
      <p className="text-sm">{t("pages.onboarding.entitlement.trail")}</p>
      <ul className="flex flex-wrap gap-2 pt-1" aria-label={t("pages.onboarding.entitlement.breakdown")}>
        {top.map(({ item, qty }) => (
          <li key={item.id} className="flex items-center gap-1.5 rounded-full bg-card/80 py-1 pe-3 ps-1 text-xs font-medium text-foreground">
            <ItemIcon itemId={item.id} size={24} />
            <span>{localized(item, "name", locale)}</span>
            <bdi className="tabular text-muted-foreground">
              {formatNumber(qty, locale, 1)} {unit(item.unit)}
            </bdi>
          </li>
        ))}
      </ul>
    </div>
  );
}
