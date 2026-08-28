import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

const PUBLIC_PATHS = ["/login"];

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(5_000),
  });
}

function redirectWithCookies(url: URL, cookies: CookieToSet[]) {
  const redirect = NextResponse.redirect(url);
  for (const { name, value, options } of cookies) {
    redirect.cookies.set(name, value, options);
  }
  return redirect;
}

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  const { url, anonKey } = getSupabaseEnv();
  let response = NextResponse.next({ request });
  let refreshedCookies: CookieToSet[] = [];

  const supabase = createServerClient(url, anonKey, {
    global: { fetch: fetchWithTimeout },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        refreshedCookies = cookiesToSet;
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

  // Session read + refresh. getSession avoids the extra Auth round-trip that
  // getUser() makes on every full page load.
  let user: { id: string } | null = null;
  try {
    const { data } = await supabase.auth.getSession();
    user = data.session?.user ?? null;
  } catch {
    return response;
  }

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!user && !isPublic) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search =
      pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return redirectWithCookies(redirectUrl, refreshedCookies);
  }

  if (user && isPublic) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/tracking";
    redirectUrl.search = "";
    return redirectWithCookies(redirectUrl, refreshedCookies);
  }

  return response;
}
