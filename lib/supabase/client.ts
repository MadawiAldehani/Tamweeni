// Browser-side Supabase client (anon key + the user's session cookie). One per tab.
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type TamweeniClient = SupabaseClient<Database>;

let client: TamweeniClient | null = null;

export function getSupabaseBrowserClient(): TamweeniClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  client = createBrowserClient<Database>(url, anonKey);
  return client;
}
