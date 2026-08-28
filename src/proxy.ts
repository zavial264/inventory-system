import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/update-session";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Document navigations only. RSC fetches and Server Actions skip the proxy
     * entirely — the app layout refreshes auth and loading them here doubled
     * every client-side navigation latency.
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
