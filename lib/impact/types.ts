// Shape of the public /impact numbers. Served by app/api/impact/route.ts from either
// live Supabase aggregates (lib/impact/aggregate.ts) or the pilot projection (lib/impact/demo.ts).
// The headline is what families LEAVE in the system (subsidy saved); donations are a footnote.
import type { Governorate } from "@/lib/ration/governorates";

export type GovernorateImpact = {
  id: Governorate;
  households: number;
  /** (collected − used) ÷ collected, 0..1; null below the 30-household threshold. */
  overCollectionRate: number | null;
};

export type ImpactStats = {
  households: number;
  /** Kilograms (litres count as kilograms) of entitlement families chose not to collect — left for the country. */
  kgNotTaken: number;
  /** Subsidy value of what was not taken, in KD. */
  kdSaved: number;
  /** Kilograms (litres count as kilograms) of already-collected leftovers given to the Kuwait Food Bank. */
  kgDonated: number;
  /** Subsidy value of those leftovers, in KD. */
  kdDonated: number;
  /** National (collected − used) ÷ collected, 0..1; null until any household has a check-in. */
  overCollectionRate: number | null;
  governorates: GovernorateImpact[];
  /** ISO timestamp of when the figures were computed. */
  updatedAt: string;
  source: "demo" | "live";
};
