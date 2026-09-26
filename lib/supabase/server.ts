// Server-side Supabase clients for Route Handlers and Server Components (Next 15 async cookies()).
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

function publicEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return { url, anonKey };
}

/** Acts as the signed-in user (session read from cookies). Create one per request. */
export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const { url, anonKey } = publicEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components cannot set cookies; the middleware/route handler refreshes the session instead.
        }
      },
    },
  });
}

/**
 * Bypasses RLS with the service-role key. Server only — never import from client code.
 * Used by aggregate endpoints such as /api/impact.
 */
export function createServiceClient(): SupabaseClient<Database> {
  const { url } = publicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing: add it to .env.local (server only, never NEXT_PUBLIC_)");
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
