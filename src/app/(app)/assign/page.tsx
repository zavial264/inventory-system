import type { Metadata } from "next";

import { AssignmentForm } from "@/components/assign/assignment-form";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Assign Work · Boutique Inventory",
};

export default async function AssignPage({
  searchParams,
}: PageProps<"/assign">) {
  const params = await searchParams;
  const employee = params.employee;
  const defaultEmployeeId = typeof employee === "string" ? employee : undefined;

  return (
    <>
      <PageHeader
        title="Assign work"
        description="Hand articles to a tailor. The stitching rate comes from the article catalogue and cannot be edited here."
      />
      <AssignmentForm defaultEmployeeId={defaultEmployeeId} />
    </>
  );
}
