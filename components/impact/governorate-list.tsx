"use client";

import { buildGovernorates } from "@/components/impact/impact-data";
import { formatNumber } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";

/** Six governorates with an empty bar each until 30 households report in one. */
export function GovernorateList() {
  const { t, locale } = useLanguage();
  const governorates = buildGovernorates();

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t("pages.impact.governorate.title")}</h2>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {governorates.map(({ id, rate }) => (
          <li key={id} className="flex flex-col gap-3 rounded-2xl bg-secondary/50 p-4">
            <span className="text-sm font-medium">{t(`pages.impact.governorate.${id}`)}</span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-[900ms] ease-out"
                style={{ width: rate === null ? "0%" : `${rate}%` }}
              />
            </div>
            <span className="tabular text-xs text-muted-foreground">
              {rate === null ? "—" : `${formatNumber(rate, locale, 0)}%`}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">{t("pages.impact.governorate.caption")}</p>
    </section>
  );
}
