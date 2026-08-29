import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, PlatformUser } from "@/lib/types";

export async function loadPlatformUsers(): Promise<PlatformUser[]> {
  const admin = createAdminClient();
  const supabase = await createClient();

  const [{ data: authData, error: authError }, { data: appUsers, error: appError }] =
    await Promise.all([
      admin.auth.admin.listUsers({ perPage: 1000 }),
      supabase.from("app_users").select("*"),
    ]);

  if (authError) throw new Error(authError.message);
  if (appError) throw new Error(appError.message);

  const roleById = new Map(
    (appUsers ?? []).map((row) => [
      row.id,
      {
        role: row.role as AppRole,
        invitedAt: row.invited_at,
        createdAt: row.created_at,
      },
    ]),
  );

  return (authData.users ?? [])
    .map((user) => {
      const profile = roleById.get(user.id);
      return {
        id: user.id,
        email: user.email ?? "",
        role: profile?.role ?? "admin",
        invitedAt: profile?.invitedAt ?? null,
        createdAt: profile?.createdAt ?? user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
      } satisfies PlatformUser;
    })
    .filter((user) => user.email.length > 0)
    .sort((a, b) => a.email.localeCompare(b.email));
}
