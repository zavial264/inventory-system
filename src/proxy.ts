import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { isSupabaseConfigured, getSupabaseEnv } from "@/lib/supabase/env";

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  // Without credentials there is no session to refresh. Let the request through
  // so the app can render its own setup screen.
  if (!isSupabaseConfigured()) return NextResponse.next({ request });

  const { url, anonKey } = getSupabaseEnv();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Session from cookie — no extra Auth API round-trip. Full page loads still
  // refresh tokens via setAll when the access token has expired.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!user && !isPublic) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isPublic) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/tracking";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Skip link prefetches, RSC navigations, and Server Actions. Without this,
     * Next.js dev mode fires the proxy many times per click and each one was
     * calling Supabase auth.
     */
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "next-router-state-tree" },
        { type: "header", key: "next-action" },
      ],
    },
  ],
};
