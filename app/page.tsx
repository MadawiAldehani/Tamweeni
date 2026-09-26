"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useData } from "@/lib/data/provider";

/** Entry gate: households go home, newcomers go to onboarding. */
export default function EntryPage() {
  const { loading, snapshot } = useData();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(snapshot.household ? "/home" : "/onboarding");
  }, [loading, snapshot.household, router]);

  return null;
}
