import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { ReceiptsTable } from "@/components/receipts/receipts-table";

export const metadata: Metadata = {
  title: "Receipts",
};

export default function ReceiptsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <PageHeader
        className="mb-0 shrink-0"
        title="Receipts"
        description="Handover slips issued to employees. Re-printing shows the original slip exactly as it was generated."
      />
      <ReceiptsTable />
    </div>
  );
}
