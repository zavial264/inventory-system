import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { ReceiptsTable } from "@/components/receipts/receipts-table";

export const metadata: Metadata = {
  title: "Receipts",
};

export default function ReceiptsPage() {
  return (
    <>
      <PageHeader
        title="Receipts"
        description="Handover slips issued to employees. Re-printing shows the original slip exactly as it was generated."
      />
      <ReceiptsTable />
    </>
  );
}
