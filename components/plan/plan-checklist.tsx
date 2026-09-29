"use client";

import { Check, Leaf, Pencil, Share2, Store } from "lucide-react";
import type { CSSProperties } from "react";

import { ItemIcon } from "@/components/common/item-icon";
import { usePlanShare } from "@/components/plan/use-plan-share";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Household, Member, PlanWithLines } from "@/lib/data/types";
import { formatNumber, monthLabel } from "@/lib/format";
import { localized, useLanguage } from "@/lib/i18n/provider";
import { packLabel } from "@/lib/plan/packs";
import { buildShareText } from "@/lib/plan/share";
import { formatSurplus, savedPlanTotals } from "@/lib/plan/totals";
import { unitFor } from "@/lib/plan/units";
import { getItem } from "@/lib/ration/catalog";

type PlanChecklistProps = {
  plan: PlanWithLines;
  household: Household | null;
  members: Member[];
  onEdit: () => void;
};

const at = (i: number) => ({ "--i": i }) as CSSProperties;

/** The saved plan as a clean list to show at the branch, with Share and Edit. What the family is not taking stays in the system. */
export function PlanChecklist({ plan, household, members, onEdit }: PlanChecklistProps) {
  const { t, locale } = useLanguage();
  const { status, share } = usePlanShare();

  const lines = plan.lines
    .filter((l) => l.planned_qty > 0)
    .map((l) => {
      const item = getItem(l.item_id);
      const unit = unitFor(item.unit, l.planned_qty, t);
      return {
        item,
        name: localized(item, "name", locale),
        qty: `${formatNumber(l.planned_qty, locale, 2)} ${unit}`,
        pack: packLabel(item, l.planned_qty, t),
      };
    });
  const planTotals = savedPlanTotals(plan, members);
  const totals = t("pages.plan.checklist.totals", { count: lines.length, kg: formatNumber(planTotals.needKg, locale, 1) });
  const notTaking = planTotals.takingEverything ? "" : t("pages.plan.checklist.surplus", { surplus: formatSurplus(planTotals, locale, t) });

  const onShare = () => {
    const text = buildShareText(locale, t, {
      household: household?.name ?? "",
      coop: household?.coop_name ?? "",
      month: plan.month,
      lines,
      needKg: planTotals.needKg,
      notTaking,
    });
    const title = `${locale === "ar" ? t("app.nameArabic") : t("app.name")} — ${t("pages.plan.checklist.title")}`;
    void share(title, text);
  };

  return (
    <div className="stagger flex flex-col gap-3">
      <Card style={at(0)}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <Badge variant="secondary" className="w-fit">
                <Check aria-hidden="true" />
                {t("pages.plan.checklist.saved")}
              </Badge>
              <h2 className="mt-1 truncate text-lg font-semibold">{t("pages.plan.checklist.title")}</h2>
              <p className="truncate text-sm text-muted-foreground">
                {[household?.name, household?.coop_name].filter(Boolean).join(" · ")}
              </p>
              <p className="tabular text-sm text-muted-foreground">
                <bdi>{monthLabel(plan.month, locale)}</bdi>
              </p>
            </div>
            <Button variant="outline" size="lg" className="pressable h-11 shrink-0 rounded-xl px-3" onClick={onEdit}>
              <Pencil aria-hidden="true" />
              {t("common.edit")}
            </Button>
          </div>

          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("pages.plan.checklist.empty")}</p>
          ) : (
            <ul className="divide-y divide-dashed divide-foreground/10">
              {lines.map((l) => (
                <li key={l.item.id} className="flex items-center gap-3 py-2.5">
                  <ItemIcon itemId={l.item.id} size={36} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{l.name}</span>
                  <span className="flex shrink-0 flex-col items-end text-end">
                    <bdi className="tabular text-base font-semibold">{l.qty}</bdi>
                    {l.pack ? <bdi className="tabular text-xs text-muted-foreground">{l.pack}</bdi> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-1 border-t border-dashed border-foreground/10 pt-3">
            <p className="tabular text-sm font-medium">
              <bdi>{totals}</bdi>
            </p>
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Store className="size-3.5 shrink-0" aria-hidden="true" />
              {t("pages.plan.checklist.showAtBranch")}
            </p>
            {notTaking ? (
              <p className="tabular inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Leaf className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                <bdi>{notTaking}</bdi>
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div style={at(1)} className="flex flex-col gap-2">
        <Button size="lg" className="pressable h-12 rounded-xl text-base" onClick={onShare}>
          <Share2 aria-hidden="true" />
          {status === "copied" ? t("pages.plan.checklist.copied") : t("pages.plan.checklist.share")}
        </Button>
        {status === "failed" ? (
          <p className="text-center text-xs text-destructive" role="status">
            {t("pages.plan.checklist.copyFailed")}
          </p>
        ) : null}
        <Button variant="outline" size="lg" className="pressable h-12 rounded-xl text-base" onClick={onEdit}>
          {t("pages.plan.checklist.edit")}
        </Button>
      </div>
    </div>
  );
}
