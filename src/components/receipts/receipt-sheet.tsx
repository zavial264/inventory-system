"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, PrinterIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BOUTIQUE_PROFILE } from "@/lib/boutique";
import { formatDateTime } from "@/lib/format";
import type { Receipt } from "@/lib/types";

export function ReceiptSheet({ receipt }: { receipt: Receipt }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoPrint = searchParams.get("auto") === "1";
  const printed = React.useRef(false);

  React.useEffect(() => {
    if (!autoPrint || printed.current) return;
    printed.current = true;
    // Let the sheet paint before handing over to the browser print dialog.
    const timer = window.setTimeout(() => window.print(), 350);
    return () => window.clearTimeout(timer);
  }, [autoPrint]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:px-0 print:py-0">
      <div className="no-print mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/tracking")}>
          <ArrowLeftIcon />
          Back to tracking
        </Button>
        <Button onClick={() => window.print()}>
          <PrinterIcon />
          Print
        </Button>
      </div>

      <article className="rounded-xl border border-border bg-white p-8 text-black shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-300 pb-5">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {BOUTIQUE_PROFILE.name}
            </h1>
            <p className="mt-0.5 text-sm text-neutral-600">
              {BOUTIQUE_PROFILE.addressLine}
            </p>
            <p className="text-sm text-neutral-600">{BOUTIQUE_PROFILE.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-neutral-500">
              Stitching handover receipt
            </p>
            <p className="mt-1 font-mono text-base font-semibold">
              {receipt.receiptNo}
            </p>
            <p className="text-sm text-neutral-600">
              {formatDateTime(receipt.createdAt)}
            </p>
          </div>
        </header>

        <section className="grid gap-4 border-b border-neutral-300 py-5 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-500">
              Received from
            </p>
            <p className="mt-1 text-lg font-semibold">
              {receipt.snapshot.employeeName}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-widest text-neutral-500">
              Total pieces
            </p>
            <p className="tabular mt-1 text-lg font-semibold">
              {receipt.totalPieces}
            </p>
          </div>
        </section>

        <section className="py-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-300 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="w-10 pb-2 font-medium">#</th>
                <th className="pb-2 font-medium">Article</th>
                <th className="w-24 pb-2 font-medium">Size</th>
                <th className="w-32 pb-2 text-right font-medium">
                  Pieces completed
                </th>
              </tr>
            </thead>
            <tbody>
              {receipt.snapshot.lines.map((line, index) => (
                <tr
                  key={`${line.articleName}-${line.size}`}
                  className="border-b border-neutral-200"
                >
                  <td className="py-2.5 text-neutral-500">{index + 1}</td>
                  <td className="py-2.5 font-medium">{line.articleName}</td>
                  <td className="py-2.5">{line.size}</td>
                  <td className="tabular py-2.5 text-right font-medium">
                    {line.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="pt-3 text-right font-medium">
                  Total
                </td>
                <td className="tabular pt-3 text-right text-base font-semibold">
                  {receipt.totalPieces}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        <p className="rounded-md bg-neutral-100 px-4 py-3 text-xs text-neutral-600 print:bg-transparent print:px-0">
          This slip records quantities only. Please count the pieces against the
          table above before signing.
        </p>

        <section className="mt-12 grid grid-cols-2 gap-10">
          <div>
            <div className="h-10 border-b border-neutral-400" />
            <p className="mt-2 text-xs text-neutral-600">
              Handed over by (employee)
            </p>
          </div>
          <div>
            <div className="h-10 border-b border-neutral-400" />
            <p className="mt-2 text-xs text-neutral-600">
              Received by (next stage)
            </p>
          </div>
        </section>
      </article>
    </div>
  );
}
