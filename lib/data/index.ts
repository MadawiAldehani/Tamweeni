import type { DataStore } from "@/lib/data/types";

/** Mock mode is the default: it needs zero env vars and runs entirely in localStorage. */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

let store: DataStore | null = null;

/** Lazily builds the single store for this browser tab (client-side only). */
export async function getStore(): Promise<DataStore> {
  if (store) return store;
  if (isSupabaseConfigured()) {
    const { SupabaseStore } = await import("@/lib/data/supabase");
    store = new SupabaseStore();
  } else {
    const { LocalStore } = await import("@/lib/data/local");
    store = new LocalStore();
  }
  return store;
}
