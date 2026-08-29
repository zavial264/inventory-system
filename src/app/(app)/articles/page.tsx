import type { Metadata } from "next";

import { ArticlesTable } from "@/components/articles/articles-table";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUserRole } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Articles & Rates",
};

export default async function ArticlesPage() {
  const userRole = await getCurrentUserRole();
  const isSuperAdmin = userRole === "super_admin";

  return (
    <>
      <PageHeader
        title="Articles & rates"
        description={
          isSuperAdmin
            ? "Manage garment types and stitching rates. New assignments pick up the current rate; past work keeps the rate from the day it was assigned."
            : "The stitching rate charged per piece. Rates are copied onto each assignment when it is created."
        }
      />
      <ArticlesTable />
    </>
  );
}
