"use client";

import * as React from "react";
import {
  CoinsIcon,
  Loader2Icon,
  ScrollTextIcon,
  ShirtIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEmployeeLedgerAction } from "@/lib/data/ledger-actions";
import { formatCurrency, formatDate, formatNumber, toDateInputValue } from "@/lib/format";
import {
  LEDGER_MAX_DAYS,
  constrainLedgerFrom,
  constrainLedgerTo,
  defaultLedgerRange,
  latestLedgerTo,
} from "@/lib/ledger";
import { cn } from "@/lib/utils";
import type { Employee, EmployeeLedger } from "@/lib/types";

export function EmployeeLedgerDialog({
  employee,
  open,
  onOpenChange,
}: {
  employee?: Employee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const today = toDateInputValue();
  const defaults = defaultLedgerRange(today);
  const [from, setFrom] = React.useState(defaults.from);
  const [to, setTo] = React.useState(defaults.to);
  const [ledger, setLedger] = React.useState<EmployeeLedger | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!open || !employee) return;

    let cancelled = false;

    getEmployeeLedgerAction(employee.id, from, to).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (!result.ok) {
        setLedger(null);
        setError(result.error);
        return;
      }
      setError(null);
      setLedger(result.data);
    });

    return () => {
      cancelled = true;
    };
  }, [open, employee, from, to]);

  const applyRange = (next: { from: string; to: string }) => {
    if (next.from === from && next.to === to) return;
    setFrom(next.from);
    setTo(next.to);
    setLoading(true);
    setError(null);
    setLedger(null);
  };

  const resetDates = () => {
    applyRange(defaultLedgerRange());
  };

  const dateFilterActive = from !== defaults.from || to !== defaults.to;
  const titleName = ledger?.employeeName ?? employee?.name ?? "Employee";
  const toMax = latestLedgerTo(from, today);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(38rem,calc(100dvh-2rem))] max-w-3xl flex-col gap-5">
        <DialogHeader className="shrink-0">
          <DialogTitle>Ledger · {titleName}</DialogTitle>
          <DialogDescription>
            Completed stitching priced at the assignment rate. Choose up to{" "}
            {LEDGER_MAX_DAYS} days.
          </DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="ledger-from" className="text-xs">
                Worked from
              </Label>
              <DateInput
                id="ledger-from"
                value={from}
                onValueChange={(next) => {
                  if (!next) return;
                  applyRange(constrainLedgerFrom(next, to));
                }}
                max={today}
                required
                placeholder="Start date"
                className="w-44"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ledger-to" className="text-xs">
                Worked to
              </Label>
              <DateInput
                id="ledger-to"
                value={to}
                onValueChange={(next) => {
                  if (!next) return;
                  applyRange(constrainLedgerTo(from, next));
                }}
                min={from}
                max={toMax}
                required
                placeholder="End date"
                className="w-44"
              />
            </div>

            {dateFilterActive ? (
              <Button
                type="button"
                variant="outline"
                className="h-9 gap-1.5 border-input text-muted-foreground hover:text-foreground"
                onClick={resetDates}
              >
                <XIcon className="size-3.5" />
                Clear date filter
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDate(from)} – {formatDate(to)} · max {LEDGER_MAX_DAYS} days
          </p>
        </div>

        <div className="grid shrink-0 gap-3 sm:grid-cols-2">
          <StatCard
            label="Pieces"
            value={loading ? "—" : formatNumber(ledger?.totalPieces ?? 0)}
            icon={ShirtIcon}
          />
          <StatCard
            label="Total payable"
            value={loading ? "—" : formatCurrency(ledger?.totalAmount ?? 0)}
            icon={CoinsIcon}
            tone="success"
          />
        </div>

        <div
          className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border"
          aria-busy={loading}
          aria-live="polite"
        >
          {loading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-card">
              <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading ledger</p>
            </div>
          ) : error ? (
            <div className="flex flex-1 items-center justify-center px-6">
              <p className="text-center text-sm text-destructive">{error}</p>
            </div>
          ) : !ledger || ledger.entries.length === 0 ? (
            <EmptyState
              icon={ScrollTextIcon}
              title="No completed work in this period"
              description="Completions recorded for this employee will appear here. Try a different date range of up to 30 days."
              className="min-h-0 flex-1 border-0 py-0"
            />
          ) : (
            <Table containerClassName="min-h-0 flex-1 overflow-auto">
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="border-b border-border hover:bg-muted">
                  <TableHead className="sticky top-0 z-10 bg-muted">
                    Date
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-muted">
                    Article
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-muted">
                    Size
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-muted text-right">
                    Qty
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-muted text-right">
                    Rate
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-muted text-right">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.entries.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className={cn(
                      entry.quantity < 0 && "text-muted-foreground",
                    )}
                  >
                    <TableCell className="whitespace-nowrap">
                      {formatDate(entry.occurredOn)}
                    </TableCell>
                    <TableCell>{entry.articleName}</TableCell>
                    <TableCell>{entry.size}</TableCell>
                    <TableCell className="tabular text-right">
                      {formatNumber(entry.quantity)}
                    </TableCell>
                    <TableCell className="tabular text-right text-muted-foreground">
                      {formatCurrency(entry.unitPrice)}
                    </TableCell>
                    <TableCell className="tabular text-right font-medium">
                      {formatCurrency(entry.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
