import { AppSidebar, MobileNav } from "@/components/layout/app-sidebar";
import { SetupRequired } from "@/components/setup-required";
import { getAuthUser } from "@/lib/data/auth";
import { getCoreSnapshot } from "@/lib/data/queries";
import { InventoryProvider } from "@/lib/store/inventory-provider";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const [user, snapshot] = await Promise.all([getAuthUser(), getCoreSnapshot()]);

  if (!user) redirect("/login");

  return (
    <InventoryProvider snapshot={snapshot}>
      <div className="flex min-h-svh items-start">
        <AppSidebar userEmail={user.email ?? "admin"} />
        <div className="flex min-h-svh min-w-0 flex-1 flex-col">
          <MobileNav />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
            {children}
          </main>
        </div>
      </div>
    </InventoryProvider>
  );
}
