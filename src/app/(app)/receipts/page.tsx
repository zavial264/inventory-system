import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { ReceiptsTable } from "@/components/receipts/receipts-table";
import { getReceiptsList } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Receipts · Boutique Inventory",
};

export default async function ReceiptsPage() {
  const receipts = await getReceiptsList();

  return (
    <>
      <PageHeader
        title="Receipts"
        description="Handover slips issued to employees. Re-printing shows the original slip exactly as it was generated."
      />
      <ReceiptsTable receipts={receipts} />
    </>
  );
}
