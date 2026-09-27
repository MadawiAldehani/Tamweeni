// Public, anonymised national numbers for /impact. Live aggregates when a service key
// exists (cached 5 minutes in memory), the pilot projection otherwise. Never leaks errors.
import { NextResponse } from "next/server";

import { aggregateImpact } from "@/lib/impact/aggregate";
import { DEMO_IMPACT } from "@/lib/impact/demo";
import type { ImpactStats } from "@/lib/impact/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_MS = 5 * 60 * 1000;
let cache: { stats: ImpactStats; at: number } | null = null;

function liveConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

async function loadStats(): Promise<ImpactStats> {
  if (!liveConfigured()) return DEMO_IMPACT;
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.stats;
  try {
    const stats = await aggregateImpact();
    cache = { stats, at: Date.now() };
    return stats;
  } catch (error) {
    console.error("Impact aggregate failed; serving the pilot projection", error);
    return DEMO_IMPACT;
  }
}

export async function GET() {
  const stats = await loadStats();
  return NextResponse.json(stats, { headers: { "Cache-Control": "public, max-age=300" } });
}
