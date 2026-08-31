"use client";

import * as React from "react";
import Link from "next/link";
import { PrinterIcon, ReceiptTextIcon, SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TablePagination,
  useClientPagination,
} from "@/components/ui/table-pagination";
import { formatCurrency, formatDate, formatDateTime, toDateInputValue } from "@/lib/format";
import { useInventory } from "@/lib/store/inventory-provider";
import type { ReceiptLine } from "@/lib/types";

function lineTotal(line: ReceiptLine) {
  if (line.lineTotal != null) return line.lineTotal;
  if (line.unitPrice != null) return line.quantity * line.unitPrice;
  return null;
}

function issuedOn(createdAt: string) {
  return toDateInputValue(new Date(createdAt));
}

export function ReceiptsTable() {
  const { state } = useInventory();
  const [search, setSearch] = React.useState("");
  const [startingFrom, setStartingFrom] = React.useState("");
  const [ending, setEnding] = React.useState("");

  const periodInvalid = Boolean(startingFrom && ending && startingFrom > ending);
  const dateFilterActive = startingFrom !== "" || ending !== "";

  const rows = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    return state.receipts.filter((receipt) => {
      if (
        query &&
        !receipt.snapshot.employeeName.toLowerCase().includes(query)
      ) {
        return false;
      }
      if (periodInvalid) return true;

      const issued = issuedOn(receipt.createdAt);
      if (startingFrom && issued < startingFrom) return false;
      if (ending && issued > ending) return false;
      return true;
    });
  }, [state.receipts, search, startingFrom, ending, periodInvalid]);

  const pagination = useClientPagination(rows);

  const clearPeriod = () => {
    setStartingFrom("");
    setEnding("");
    pagination.resetPage();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative sm:w-64">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              pagination.resetPage();
            }}
            placeholder="Search by employee"
            aria-label="Search receipts by employee"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="receipt-starting-from" className="text-xs">
              Starting from
            </Label>
            <DateInput
              id="receipt-starting-from"
              value={startingFrom}
              onValueChange={(next) => {
                setStartingFrom(next);
                pagination.resetPage();
              }}
              max={ending || undefined}
              placeholder="Start date"
              className="w-44"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="receipt-ending" className="text-xs">
              Ending
            </Label>
            <DateInput
              id="receipt-ending"
              value={ending}
              onValueChange={(next) => {
                setEnding(next);
                pagination.resetPage();
              }}
              min={startingFrom || undefined}
              placeholder="End date"
              className="w-44"
            />
          </div>

          {dateFilterActive ? (
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-1.5 border-input text-muted-foreground hover:text-foreground"
              onClick={clearPeriod}
            >
              <XIcon className="size-3.5" />
              Clear date filter
            </Button>
          ) : null}
        </div>
      </div>

      {periodInvalid ? (
        <p className="shrink-0 text-sm text-destructive">
          The start date must be on or before the end date.
        </p>
      ) : dateFilterActive ? (
        <p className="shrink-0 text-sm text-muted-foreground">
          Receipts issued
          {startingFrom ? ` from ${formatDate(startingFrom)}` : ""}
          {ending ? ` through ${formatDate(ending)}` : ""}.
        </p>
      ) : null}

      {state.receipts.length === 0 ? (
        <EmptyState
          icon={ReceiptTextIcon}
          title="No receipts issued yet"
          description="Record some completed pieces, then print a receipt from the tracking page."
          className="min-h-0 flex-1"
          action={
            <Button asChild>
              <Link href="/tracking">Go to tracking</Link>
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ReceiptTextIcon}
          title="No receipts match your filters"
          description={
            search
              ? "Try a different employee name."
              : "Try a different date range or clear the date filter."
          }
          className="min-h-0 flex-1"
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <Table containerClassName="min-h-0 flex-1 overflow-auto">
              <TableHeader sticky>
                <TableRow>
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
                {pagination.items.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-mono text-xs font-medium">
                      {receipt.receiptNo}
                    </TableCell>
                    <TableCell className="font-medium">
                      {receipt.snapshot.employeeName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {receipt.snapshot.lines
                        .map(
                          (line) =>
                            `${line.articleName} (${line.size}) × ${line.quantity}`,
                        )
                        .join(", ")}
                    </TableCell>
                    <TableCell className="tabular text-right font-medium">
                      {receipt.totalPieces}
                    </TableCell>
                    <TableCell className="tabular text-right font-medium">
                      {receipt.totalAmount != null
                        ? formatCurrency(receipt.totalAmount)
                        : receipt.snapshot.lines.some(
                              (line) => lineTotal(line) != null,
                            )
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

          <div className="shrink-0">
            <TablePagination
              page={pagination.page}
              pageCount={pagination.pageCount}
              rangeFrom={pagination.rangeFrom}
              rangeTo={pagination.rangeTo}
              total={pagination.total}
              onPageChange={pagination.setPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
