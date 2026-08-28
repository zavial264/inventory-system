"use server";

import { redirect } from "next/navigation";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export async function signInAction(
  input: LoginInput,
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Check your details");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return fail("Those details did not match an account");
  }

  return ok({ redirectTo: "/tracking" });
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
