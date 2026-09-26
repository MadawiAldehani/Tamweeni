"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useData } from "@/lib/data/provider";

/** Wraps the (app) screens: sends visitors without a household back to onboarding. */
export function RequireHousehold({ children }: { children: ReactNode }) {
  const { loading, snapshot } = useData();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !snapshot.household) router.replace("/onboarding");
  }, [loading, snapshot.household, router]);

  if (loading || !snapshot.household) return null;
  return <>{children}</>;
}
