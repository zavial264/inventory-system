import { AppSidebar, MobileNav } from "@/components/layout/app-sidebar";
import { SetupRequired } from "@/components/setup-required";
import { getInventorySnapshot } from "@/lib/data/queries";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { InventoryProvider } from "@/lib/store/inventory-provider";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // One shared client and auth check, then load data in parallel.
  const [snapshot, userRole] = await Promise.all([
    getInventorySnapshot(supabase),
    getCurrentUserRole(supabase, user.id),
  ]);

  return (
    <InventoryProvider snapshot={snapshot} userRole={userRole}>
      <div className="flex min-h-svh items-start">
        <AppSidebar userEmail={user.email ?? "admin"} userRole={userRole} />
        <div className="flex min-h-svh min-w-0 flex-1 flex-col">
          <MobileNav userRole={userRole} />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
            {children}
          </main>
        </div>
      </div>
    </InventoryProvider>
  );
}
