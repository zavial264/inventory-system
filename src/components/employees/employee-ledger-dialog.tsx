"use client";

import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CoinsIcon,
  Loader2Icon,
  ScrollTextIcon,
  ShirtIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEmployeeWeekLedgerAction } from "@/lib/data/ledger-actions";
import {
  addDaysIso,
  formatCurrency,
  formatDate,
  formatNumber,
  startOfWeekMonday,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Employee, EmployeeWeekLedger } from "@/lib/types";

export function EmployeeLedgerDialog({
  employee,
  open,
  onOpenChange,
}: {
  employee?: Employee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const currentWeekStart = startOfWeekMonday();
  const [weekStart, setWeekStart] = React.useState(currentWeekStart);
  const [ledger, setLedger] = React.useState<EmployeeWeekLedger | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!open || !employee) return;

    let cancelled = false;

    getEmployeeWeekLedgerAction(employee.id, weekStart).then((result) => {
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
  }, [open, employee, weekStart]);

  const shiftWeek = (days: number) => {
    setWeekStart((current) => addDaysIso(current, days));
    setLoading(true);
    setError(null);
    setLedger(null);
  };

  const canGoNext = weekStart < currentWeekStart;
  const titleName = ledger?.employeeName ?? employee?.name ?? "Employee";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(36rem,calc(100dvh-2rem))] max-w-3xl flex-col gap-5">
        <DialogHeader className="shrink-0">
          <DialogTitle>Ledger · {titleName}</DialogTitle>
          <DialogDescription>
            Completed stitching for one week, priced at the assignment rate.
            The database keeps the full history; this view is week by week.
          </DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Previous week"
              disabled={loading}
              onClick={() => shiftWeek(-7)}
            >
              <ChevronLeftIcon />
            </Button>
            <p className="min-w-48 px-2 text-center text-sm font-medium">
              {formatDate(weekStart)} – {formatDate(addDaysIso(weekStart, 6))}
            </p>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Next week"
              disabled={loading || !canGoNext}
              onClick={() => shiftWeek(7)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Monday – Sunday</p>
        </div>

        <div className="grid shrink-0 gap-3 sm:grid-cols-2">
          <StatCard
            label="Pieces this week"
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
              title="No completed work this week"
              description="Completions recorded for this employee will appear here. Try another week if they worked earlier."
              className="min-h-0 flex-1 border-0 py-0"
            />
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Date</TableHead>
                    <TableHead>Article</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
