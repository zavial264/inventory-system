import "server-only";

import {
  ensureFreshSession,
  isClockSkewError,
  withClockSkewRetry,
} from "@/lib/supabase/clock-skew";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types";

type Client = Awaited<ReturnType<typeof createClient>>;

export async function getCurrentUserRole(
  client?: Client,
  userId?: string,
): Promise<AppRole> {
  const supabase = client ?? (await createClient());

  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "admin";
    resolvedUserId = user.id;
  }

  const { data, error } = await withClockSkewRetry(
    async () => {
      await ensureFreshSession(supabase);
      return supabase
        .from("app_users")
        .select("role")
        .eq("id", resolvedUserId)
        .maybeSingle();
    },
    (result) => Boolean(result.error && isClockSkewError(result.error.message)),
  );

  if (error || !data?.role) return "admin";
  return data.role as AppRole;
}

export async function requireSuperAdmin(
  message = "Only a Super Admin can do that",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const role = await getCurrentUserRole();
  if (role !== "super_admin") {
    return { ok: false, error: message };
  }
  return { ok: true };
}
