// Illustrative PILOT PROJECTIONS for the public /impact page, used when no Supabase
// service key exists (mock mode) or the live aggregate fails. The UI labels them as a
// projection, never as measured data. Replace with live aggregates (lib/impact/aggregate.ts)
// as households join. Based on the 2025 MOCI ration figures and the pilot's first families.
//
// These are projections, not measurements: kgNotTaken / kdSaved model what families would leave
// in the system by taking only what they need; kgDonated / kdDonated are leftovers that already
// happened and were given to the Food Bank — a secondary line, never derived from the plan.
import type { ImpactStats } from "@/lib/impact/types";

export const DEMO_IMPACT: ImpactStats = {
  households: 1284,
  kgNotTaken: 22410,
  kdSaved: 11205,
  kgDonated: 3180,
  kdDonated: 1590,
  overCollectionRate: 0.31,
  governorates: [
    { id: "capital", households: 214, overCollectionRate: 0.29 },
    { id: "hawalli", households: 302, overCollectionRate: 0.33 },
    { id: "farwaniya", households: 251, overCollectionRate: 0.28 },
    { id: "ahmadi", households: 198, overCollectionRate: 0.34 },
    { id: "jahra", households: 171, overCollectionRate: 0.36 },
    { id: "mubarak_al_kabeer", households: 148, overCollectionRate: 0.27 },
  ],
  updatedAt: "2026-09-26T00:00:00.000Z",
  source: "demo",
};
