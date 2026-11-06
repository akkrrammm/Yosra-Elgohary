import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/** Only a page inside the dashboard, never an address supplied from outside. */
const safeNext = (next: string | null) => (next && /^\/admin(\/[\w/-]*)?$/.test(next) ? next : "/admin");

/** Where the link in a password email lands. Turns it into a session, then moves on. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const redirectTo = (pathname: string, search = "") => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = search;
    return NextResponse.redirect(url);
  };

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : tokenHash && type
        ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        : { error: new Error("This link is missing its code.") };

    if (!error) return redirectTo(safeNext(searchParams.get("next")));
    console.error("[cms] sign-in link:", error.message);
  }

  return redirectTo("/admin/login", "?error=link");
}
