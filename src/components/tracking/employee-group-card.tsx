"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronDownIcon,
  HistoryIcon,
  PackagePlusIcon,
  PlusIcon,
  PrinterIcon,
} from "lucide-react";

import { ProgressBar } from "@/components/tracking/progress-bar";
import { StatusBadge } from "@/components/tracking/assignment-summary";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate, initialsOf } from "@/lib/format";
import type { AssignmentView, EmployeeGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EmployeeGroupCard({
  group,
  defaultOpen,
  receiptPending,
  onRecord,
  onHistory,
  onTopUp,
  onPrintReceipt,
}: {
  group: EmployeeGroup;
  defaultOpen?: boolean;
  receiptPending?: boolean;
  onRecord: (assignment: AssignmentView) => void;
  onHistory: (assignment: AssignmentView) => void;
  onTopUp: (assignment: AssignmentView) => void;
  onPrintReceipt: (employeeId: string) => void;
}) {
  const [open, setOpen] = React.useState(defaultOpen ?? true);
  const canPrint = group.unreceiptedPieces > 0;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
              {initialsOf(group.employee.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold">
                  {group.employee.name}
                </span>
                <ChevronDownIcon
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    open && "rotate-180",
                  )}
                />
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {group.assignments.length} line
                {group.assignments.length === 1 ? "" : "s"}
                {group.employee.phone ? ` · ${group.employee.phone}` : ""}
              </span>
            </span>
          </CollapsibleTrigger>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/assign?employee=${group.employee.id}`}>
                <PlusIcon />
                Assign more
              </Link>
            </Button>

            {canPrint ? (
              <Button
                size="sm"
                disabled={receiptPending}
                onClick={() => onPrintReceipt(group.employee.id)}
              >
                <PrinterIcon />
                Print receipt
                <span className="tabular ml-0.5 rounded-full bg-primary-foreground/20 px-1.5 text-xs">
                  {group.unreceiptedPieces}
                </span>
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button size="sm" disabled>
                      <PrinterIcon />
                      Print receipt
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  No completed pieces are waiting to be receipted for this
                  employee.
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:max-w-md">
          <GroupStat label="Assigned" value={group.totalAssigned} />
          <GroupStat label="Completed" value={group.totalCompleted} />
          <GroupStat
            label="Remaining"
            value={group.totalRemaining}
            tone={group.totalRemaining > 0 ? "warning" : "success"}
          />
        </div>
      </div>

      <CollapsibleContent>
        <div className="border-t border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Article</TableHead>
                <TableHead className="w-16">Size</TableHead>
                <TableHead className="w-20 text-right">Assigned</TableHead>
                <TableHead className="w-24 text-right">Completed</TableHead>
                <TableHead className="w-24 text-right">Remaining</TableHead>
                <TableHead className="w-40">Progress</TableHead>
                <TableHead className="w-32">Assigned on</TableHead>
                <TableHead className="w-px text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div className="font-medium">
                      {assignment.articleType.name}
                    </div>
                    {assignment.notes ? (
                      <div className="max-w-48 truncate text-xs text-muted-foreground">
                        {assignment.notes}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex min-w-7 justify-center rounded border border-border px-1.5 py-0.5 text-xs font-medium">
                      {assignment.size}
                    </span>
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {assignment.quantityAssigned}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {assignment.completedQuantity}
                  </TableCell>
                  <TableCell className="tabular text-right font-medium">
                    {assignment.remainingQuantity}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1.5">
                      <ProgressBar
                        completed={assignment.completedQuantity}
                        total={assignment.quantityAssigned}
                      />
                      <StatusBadge status={assignment.status} />
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(assignment.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRecord(assignment)}
                        disabled={assignment.remainingQuantity <= 0}
                      >
                        Record
                      </Button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label="Assign more on this line"
                            onClick={() => onTopUp(assignment)}
                          >
                            <PackagePlusIcon />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Assign more on this line</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label="View line history"
                            onClick={() => onHistory(assignment)}
                          >
                            <HistoryIcon />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View history</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function GroupStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warning" | "success";
}) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "tabular text-lg font-semibold leading-tight",
          tone === "warning" && "text-warning-foreground",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </p>
    </div>
  );
}
