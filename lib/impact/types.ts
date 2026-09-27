// Shape of the public /impact numbers. Served by app/api/impact/route.ts from either
// live Supabase aggregates (lib/impact/aggregate.ts) or the pilot projection (lib/impact/demo.ts).
import type { Governorate } from "@/lib/ration/governorates";

export type GovernorateImpact = {
  id: Governorate;
  households: number;
  /** (collected − used) ÷ collected, 0..1; null below the 30-household threshold. */
  overCollectionRate: number | null;
};

export type ImpactStats = {
  households: number;
  /** Kilograms (litres count as kilograms) pledged to the Kuwait Food Bank. */
  kgPledged: number;
  /** Subsidy value of everything pledged, in KD. */
  kdRedirected: number;
  /** National (collected − used) ÷ collected, 0..1; null until any household has a check-in. */
  overCollectionRate: number | null;
  governorates: GovernorateImpact[];
  /** ISO timestamp of when the figures were computed. */
  updatedAt: string;
  source: "demo" | "live";
};
