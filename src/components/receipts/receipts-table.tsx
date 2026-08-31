"use client";

import * as React from "react";
import Link from "next/link";
import { PrinterIcon, ReceiptTextIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { useInventory } from "@/lib/store/inventory-provider";
import type { ReceiptLine } from "@/lib/types";

function lineTotal(line: ReceiptLine) {
  if (line.lineTotal != null) return line.lineTotal;
  if (line.unitPrice != null) return line.quantity * line.unitPrice;
  return null;
}

export function ReceiptsTable() {
  const { state } = useInventory();
  const receipts = state.receipts;

  if (receipts.length === 0) {
    return (
      <EmptyState
        icon={ReceiptTextIcon}
        title="No receipts issued yet"
        description="Record some completed pieces, then print a receipt from the tracking page."
        action={
          <Button asChild>
            <Link href="/tracking">Go to tracking</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="w-44">Receipt no.</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Articles</TableHead>
            <TableHead className="w-24 text-right">Pieces</TableHead>
            <TableHead className="w-32 text-right">Total</TableHead>
            <TableHead className="w-44">Issued</TableHead>
            <TableHead className="w-px text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts.map((receipt) => (
            <TableRow key={receipt.id}>
              <TableCell className="font-mono text-xs font-medium">
                {receipt.receiptNo}
              </TableCell>
              <TableCell className="font-medium">
                {receipt.snapshot.employeeName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {receipt.snapshot.lines
                  .map((line) => `${line.articleName} (${line.size}) × ${line.quantity}`)
                  .join(", ")}
              </TableCell>
              <TableCell className="tabular text-right font-medium">
                {receipt.totalPieces}
              </TableCell>
              <TableCell className="tabular text-right font-medium">
                {receipt.totalAmount != null
                  ? formatCurrency(receipt.totalAmount)
                  : receipt.snapshot.lines.some((line) => lineTotal(line) != null)
                    ? formatCurrency(
                        receipt.snapshot.lines.reduce(
                          (total, line) => total + (lineTotal(line) ?? 0),
                          0,
                        ),
                      )
                    : "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDateTime(receipt.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/receipts/${receipt.id}/print`}>
                    <PrinterIcon />
                    Print
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
