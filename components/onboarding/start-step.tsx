"use client";

import { useEffect, useState } from "react";
import { SigninCard } from "@/components/onboarding/signin-card";
import { StartChooser } from "@/components/onboarding/start-chooser";
import { useData } from "@/lib/data/provider";
import type { AuthUser } from "@/lib/data/types";

/** Undefined while the store answers; null when signed out (or always in local mode, which needs no user). */
function useAuthUser(): AuthUser | null | undefined {
  const { store } = useData();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    if (!store) return;
    let cancelled = false;
    store
      .getUser()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [store]);

  return user;
}

/** Reads ?error=auth left by /auth/callback without useSearchParams (no Suspense boundary needed). */
function useAuthErrorFlag(): boolean {
  const [flag, setFlag] = useState(false);
  useEffect(() => {
    setFlag(new URLSearchParams(window.location.search).get("error") === "auth");
  }, []);
  return flag;
}

/** Onboarding step 2: sign in first in Supabase mode, then pick demo family or own household. */
export function StartStep({ onSetup }: { onSetup: () => void }) {
  const { store, isMock } = useData();
  const user = useAuthUser();
  const authError = useAuthErrorFlag();

  if (!store || (!isMock && user === undefined)) return null;
  if (!isMock && !user) return <SigninCard store={store} authError={authError} />;
  return <StartChooser email={user?.email ?? null} onSetup={onSetup} />;
}
