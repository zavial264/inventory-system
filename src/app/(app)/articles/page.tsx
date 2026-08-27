import type { Metadata } from "next";

import { ArticlesTable } from "@/components/articles/articles-table";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Articles & Rates · Boutique Inventory",
};

export default function ArticlesPage() {
  return (
    <>
      <PageHeader
        title="Articles & rates"
        description="The stitching rate charged per piece. Rates are maintained in Supabase and copied onto each assignment when it is created."
      />
      <ArticlesTable />
    </>
  );
}
