"use server";

import { revalidatePath } from "next/cache";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { requireSuperAdmin } from "@/lib/auth/roles";
import { loadPlatformUsers } from "@/lib/data/user-queries";
import { generateTemporaryPassword } from "@/lib/password";
import {
  createPlatformUserSchema,
  updateUserRoleSchema,
  type CreatePlatformUserInput,
  type UpdateUserRoleInput,
} from "@/lib/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { PlatformUser } from "@/lib/types";

function refresh() {
  revalidatePath("/", "layout");
}

function firstIssue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Please check the details and try again";
}

export async function listPlatformUsersAction(): Promise<
  ActionResult<PlatformUser[]>
> {
  const gate = await requireSuperAdmin(
    "Only a Super Admin can manage platform users",
  );
  if (!gate.ok) return fail(gate.error);

  try {
    return ok(await loadPlatformUsers());
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not load users");
  }
}

export async function createPlatformUserAction(
  input: CreatePlatformUserInput,
): Promise<ActionResult<{ email: string; password: string }>> {
  const gate = await requireSuperAdmin(
    "Only a Super Admin can manage platform users",
  );
  if (!gate.ok) return fail(gate.error);

  const parsed = createPlatformUserSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const email = parsed.data.email.trim().toLowerCase();
  const password =
    parsed.data.password?.trim() || generateTemporaryPassword();
  const admin = createAdminClient();
  const supabase = await createClient();
  const {
    data: { user: inviter },
  } = await supabase.auth.getUser();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    const message = createError?.message ?? "Could not create the account";
    if (/already registered|already exists|duplicate/i.test(message)) {
      return fail("An account with this email already exists");
    }
    return fail(message);
  }

  const invitedUserId = created.user.id;

  const { error: profileError } = await supabase
    .from("app_users")
    .update({
      invited_by: inviter?.id ?? null,
      invited_at: new Date().toISOString(),
    })
    .eq("id", invitedUserId);

  if (profileError) {
    await admin.auth.admin.deleteUser(invitedUserId);
    return fail(profileError.message);
  }

  refresh();
  return ok({ email, password });
}

export async function updatePlatformUserRoleAction(
  input: UpdateUserRoleInput,
): Promise<ActionResult> {
  const gate = await requireSuperAdmin(
    "Only a Super Admin can manage platform users",
  );
  if (!gate.ok) return fail(gate.error);

  const parsed = updateUserRoleSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) return fail("You must be signed in");
  if (currentUser.id === parsed.data.userId) {
    return fail("You cannot change your own role");
  }

  const users = await loadPlatformUsers();
  const target = users.find((user) => user.id === parsed.data.userId);
  if (!target) return fail("That user no longer exists");

  if (
    target.role === "super_admin" &&
    parsed.data.role === "admin" &&
    users.filter((user) => user.role === "super_admin").length <= 1
  ) {
    return fail("At least one Super Admin must remain");
  }

  const { error } = await supabase
    .from("app_users")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.userId);

  if (error) return fail(error.message);

  refresh();
  return ok(undefined);
}
