// Phase-1 placeholders for the public /impact page. No React.
// Phase 2 replaces IMPACT_VALUES / GOVERNORATE_RATES with real aggregates; the page
// renders "—" + "Awaiting the first households" for every null and never invents figures.
import { formatNumber } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";

export type StatKey = "households" | "kgPledged" | "kdRedirected" | "overCollection";

export type Stat = {
  key: StatKey;
  /** null until real data exists; overCollection is a percent 0..100. */
  value: number | null;
  format: (n: number) => string;
};

export type GovernorateId = "capital" | "hawalli" | "farwaniya" | "mubarak" | "ahmadi" | "jahra";

export type Governorate = {
  id: GovernorateId;
  /** Average over-collection percent 0..100, or null below the 30-household threshold. */
  rate: number | null;
};

/** The founder can set real values here before 28 Sept. */
export const IMPACT_VALUES: Record<StatKey, number | null> = {
  households: null,
  kgPledged: null,
  kdRedirected: null,
  overCollection: null,
};

export const GOVERNORATE_RATES: Record<GovernorateId, number | null> = {
  capital: null,
  hawalli: null,
  farwaniya: null,
  mubarak: null,
  ahmadi: null,
  jahra: null,
};

const STAT_ORDER: StatKey[] = ["households", "kgPledged", "kdRedirected", "overCollection"];
const GOVERNORATE_ORDER: GovernorateId[] = ["capital", "hawalli", "farwaniya", "mubarak", "ahmadi", "jahra"];

/** Whole numbers in every cell; the "KD" / "%" units live in the label or the format. */
export function buildStats(locale: Locale): Stat[] {
  const whole = (n: number) => formatNumber(n, locale, 0);
  const percent = (n: number) => `${formatNumber(n, locale, 0)}%`;
  return STAT_ORDER.map((key) => ({
    key,
    value: IMPACT_VALUES[key],
    format: key === "overCollection" ? percent : whole,
  }));
}

export function buildGovernorates(): Governorate[] {
  return GOVERNORATE_ORDER.map((id) => ({ id, rate: GOVERNORATE_RATES[id] }));
}
