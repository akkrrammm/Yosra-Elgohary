import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, locales } from "@/lib/i18n";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Keeps the admin session alive and sends signed-out visitors to the login page.
 * This is only a convenience: the dashboard layout, every server action and the
 * database's Row Level Security each check permissions again on their own.
 */
async function handleAdmin(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // getUser, not getSession: it validates the token with Supabase Auth and refreshes it.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicAdminPage = pathname === "/admin/login" || pathname === "/admin/reset-password" || pathname.startsWith("/admin/auth/");

  // Only page visits are redirected. A save from a page left open after the session ended still
  // reaches its action, which refuses it and says why, so the editor's work stays on screen.
  const isPageVisit = request.method === "GET" || request.method === "HEAD";

  if (!user && !isPublicAdminPage && isPageVisit) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

/** The language chosen in Website Settings. Only needed for addresses with no language in them. */
async function chosenDefaultLocale() {
  if (!isSupabaseConfigured()) return defaultLocale;
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/site_settings?select=default_locale&limit=1`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      signal: AbortSignal.timeout(2000),
      next: { revalidate: 60 },
    });
    const [row] = (await response.json()) as { default_locale?: string }[];
    return row?.default_locale && hasLocale(row.default_locale) ? row.default_locale : defaultLocale;
  } catch {
    return defaultLocale;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) return handleAdmin(request);
  if (pathname.startsWith("/api/")) return NextResponse.next();

  const hasLanguage = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLanguage) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${await chosenDefaultLocale()}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skips Next internals and any file with an extension (images, robots.txt, sitemap.xml).
  matcher: ["/((?!_next|.*\\..*).*)"],
};
