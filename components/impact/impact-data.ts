// Turns ImpactStats (live or the pilot projection) into what the /impact page renders. No React.
import { formatKDWhole, formatNumber } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import { localized } from "@/lib/i18n/translate";
import type { TKey, TVars } from "@/lib/i18n/translate";
import type { ImpactStats } from "@/lib/impact/types";
import { GOVERNORATES, type Governorate } from "@/lib/ration/governorates";

export type StatKey = "households" | "kgPledged" | "kdRedirected" | "overCollection";

export type Stat = {
  key: StatKey;
  /** null renders "—" + "Awaiting the first households"; overCollection is a percent 0..100. */
  value: number | null;
  format: (n: number) => string;
};

export type GovernorateRow = {
  id: Governorate;
  name: string;
  /** Over-collection percent 0..100, or null below the 30-household threshold. */
  pct: number | null;
  households: number;
};

const STAT_ORDER: StatKey[] = ["households", "kgPledged", "kdRedirected", "overCollection"];

export function buildStats(stats: ImpactStats, locale: Locale, t: (key: TKey, vars?: TVars) => string): Stat[] {
  const whole = (n: number) => formatNumber(n, locale, 0);
  const formats: Record<StatKey, (n: number) => string> = {
    households: whole,
    kgPledged: (n) => `${whole(n)} ${t("units.kg")}`,
    kdRedirected: (n) => formatKDWhole(n, locale),
    overCollection: (n) => `${whole(n)}%`,
  };
  const values: Record<StatKey, number | null> = {
    households: stats.households,
    kgPledged: stats.kgPledged,
    kdRedirected: stats.kdRedirected,
    overCollection: stats.overCollectionRate === null ? null : stats.overCollectionRate * 100,
  };
  return STAT_ORDER.map((key) => ({ key, value: values[key], format: formats[key] }));
}

/** Localized rows sorted by rate, highest first; governorates still below the threshold come last. */
export function buildGovernorates(stats: ImpactStats, locale: Locale): GovernorateRow[] {
  const byId = new Map(stats.governorates.map((g) => [g.id, g]));
  return GOVERNORATES.map(({ id, ...names }) => {
    const gov = byId.get(id);
    const rate = gov?.overCollectionRate ?? null;
    return {
      id,
      name: localized(names, "name", locale),
      pct: rate === null ? null : rate * 100,
      households: gov?.households ?? 0,
    };
  }).sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
}
