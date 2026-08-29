import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReceiptSheet } from "@/components/receipts/receipt-sheet";
import { LoadingState } from "@/components/ui/loading-state";
import { getReceipt } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Receipt",
};

export default async function ReceiptPrintPage({
  params,
}: PageProps<"/receipts/[id]/print">) {
  const { id } = await params;
  const receipt = await getReceipt(id);

  if (!receipt) notFound();

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-10">
          <LoadingState rows={1} />
        </div>
      }
    >
      <ReceiptSheet receipt={receipt} />
    </Suspense>
  );
}
