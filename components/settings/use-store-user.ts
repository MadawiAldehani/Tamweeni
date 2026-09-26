"use client";

import { useEffect, useState } from "react";
import type { DataStore } from "@/lib/data/types";

/** Email of the signed-in Supabase user; null in local mode or while loading. */
export function useStoreUserEmail(store: DataStore | null): string | null {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!store || store.mode !== "supabase") return;
    let cancelled = false;
    store
      .getUser()
      .then((user) => {
        if (!cancelled) setEmail(user?.email ?? null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [store]);

  return email;
}
