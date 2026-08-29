import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { SetupRequired } from "@/components/setup-required";
import { BRAND } from "@/lib/brand";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const params = await searchParams;
  const next = params.next;
  const emailParam = params.email;
  const defaultEmail =
    typeof emailParam === "string" && emailParam.includes("@")
      ? emailParam
      : undefined;
  // Only allow same-origin paths, so a crafted link cannot bounce the admin off-site.
  const nextPath =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : undefined;

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            {BRAND.initials}
          </span>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">
              {BRAND.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to manage stitching assignments
            </p>
          </div>
        </div>

        <LoginForm nextPath={nextPath} defaultEmail={defaultEmail} />

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Admin access only.
        </p>
      </div>
    </div>
  );
}
