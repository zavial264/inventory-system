import { AppSidebar, MobileNav } from "@/components/layout/app-sidebar";
import { SetupRequired } from "@/components/setup-required";
import { getInventorySnapshot } from "@/lib/data/queries";
import { InventoryProvider } from "@/lib/store/inventory-provider";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const supabase = await createClient();

  // Fetched once for the whole section; server actions revalidate this layout,
  // so every page below sees fresh data after a mutation.
  const [{ data: { session } }, snapshot] = await Promise.all([
    supabase.auth.getSession(),
    getInventorySnapshot(),
  ]);
  const user = session?.user;
  if (!user) redirect("/login");

  return (
    <InventoryProvider snapshot={snapshot}>
      <div className="flex min-h-svh items-start">
        <AppSidebar userEmail={user?.email ?? "admin"} />
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
