import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { UsersTable } from "@/components/users/users-table";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { loadPlatformUsers } from "@/lib/data/user-queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Platform Users",
};

export default async function UsersPage() {
  const userRole = await getCurrentUserRole();
  if (userRole !== "super_admin") redirect("/tracking");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let users;
  try {
    users = await loadPlatformUsers();
  } catch {
    redirect("/tracking");
  }

  return (
    <>
      <PageHeader
        title="Platform users"
        description="Create admin accounts and control who has Super Admin access."
      />
      <UsersTable initialUsers={users} currentUserId={user.id} />
    </>
  );
}
