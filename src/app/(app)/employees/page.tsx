import type { Metadata } from "next";

import { EmployeesTable } from "@/components/employees/employees-table";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Employees",
};

export default function EmployeesPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <PageHeader
        className="mb-0 shrink-0"
        title="Employees"
        description="The tailors you assign work to. Deactivating someone hides them from new assignments without touching their history."
      />
      <EmployeesTable />
    </div>
  );
}
