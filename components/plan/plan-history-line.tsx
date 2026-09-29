import { History } from "lucide-react";
import { Fragment } from "react";

import { formatNumber, monthLabel } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import type { TKey, TVars } from "@/lib/i18n/translate";
import type { ItemMonthHistory } from "@/lib/insights/history";

type PlanHistoryLineProps = {
  /** Past months, newest first (see `itemHistory`). */
  history: ItemMonthHistory[];
  unit: string;
  locale: Locale;
  t: (key: TKey, vars?: TVars) => string;
};

const SHOWN_MONTHS = 2;

/**
 * The evidence under a suggestion: what was left over in past months and what the family gave
 * away in those same months. Leftovers need a check-in; when the most recent past pickup has none,
 * a nudge says so (after any older leftovers). Pure: no hooks.
 */
export function PlanHistoryLine({ history, unit, locale, t }: PlanHistoryLineProps) {
  if (history.length === 0) return null;
  const checked = history.filter((h) => h.leftover !== null).slice(0, SHOWN_MONTHS);
  const gave = donatedTotal(checked);
  const latestUnchecked = history[0]?.leftover === null;
  const rough = (n: number) => formatNumber(n, locale, 1);
  const separator = locale === "ar" ? "، " : ", ";

  return (
    <p className="tabular flex items-start gap-1.5 text-xs text-muted-foreground">
      <History aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      {checked.length === 0 ? (
        <span>{t("pages.plan.history.noCheckin")}</span>
      ) : (
        <span className="flex flex-col gap-0.5">
          <span>
            {t("pages.plan.history.label")}{" "}
            {checked.map((h, i) => (
              <Fragment key={h.month}>
                {i > 0 ? separator : null}
                <bdi>
                  {t("pages.plan.history.entry", {
                    qty: rough(h.leftover ?? 0),
                    unit,
                    month: monthLabel(h.month, locale, "short"),
                  })}
                </bdi>
              </Fragment>
            ))}
            {gave > 0 ? (
              <>
                {" · "}
                <bdi>{t("pages.plan.history.gave", { qty: rough(gave), unit })}</bdi>
              </>
            ) : null}
          </span>
          {latestUnchecked ? <span>{t("pages.plan.history.noCheckin")}</span> : null}
        </span>
      )}
    </p>
  );
}

function donatedTotal(history: ItemMonthHistory[]): number {
  return history.reduce((sum, h) => sum + h.donated, 0);
}
