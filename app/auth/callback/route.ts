// Magic-link landing: turns the one-time credential into a session cookie, then sends the user on.
// Two flows are accepted. The PKCE `code` works when the link opens in the browser that asked
// for it; `token_hash` works from anywhere (Mail app, installed PWA), so the Supabase email
// template should point at: {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink&next=/
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "/";
  // Only same-site paths: an absolute URL here would be an open redirect.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (code || (tokenHash && type)) {
    const supabase = await createSupabaseServerClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type! });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  // The onboarding page reads `error=auth` and shows the retry copy above the sign-in form.
  return NextResponse.redirect(new URL("/onboarding?error=auth", origin));
}
