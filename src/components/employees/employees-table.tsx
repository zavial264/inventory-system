"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  PencilIcon,
  PlusIcon,
  ScrollTextIcon,
  SearchIcon,
  UserCheckIcon,
  UserRoundXIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";

import { EmployeeDialog } from "@/components/employees/employee-dialog";
import { EmployeeLedgerDialog } from "@/components/employees/employee-ledger-dialog";
import { Badge } from "@/components/ui/badge";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { employeeWorkedInPeriod } from "@/lib/derive";
import { formatDate, initialsOf } from "@/lib/format";
import { useInventory } from "@/lib/store/inventory-provider";
import type { Employee } from "@/lib/types";

export function EmployeesTable() {
  const { state, assignmentViews, setEmployeeActive, isSuperAdmin } =
    useInventory();
  const [search, setSearch] = React.useState("");
  const [workedFrom, setWorkedFrom] = React.useState("");
  const [workedTo, setWorkedTo] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Employee | undefined>();
  const [ledgerEmployee, setLedgerEmployee] = React.useState<
    Employee | undefined
  >();

  const periodFilterActive = Boolean(workedFrom && workedTo);
  const periodInvalid =
    periodFilterActive && workedFrom > workedTo;

  const rows = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    return state.employees
      .filter((employee) => {
        if (query && !employee.name.toLowerCase().includes(query)) return false;
        if (!periodFilterActive || periodInvalid) return true;
        return employeeWorkedInPeriod(
          employee.id,
          workedFrom,
          workedTo,
          assignmentViews,
          state.completionEntries,
        );
      })
      .map((employee) => {
        const lines = assignmentViews.filter(
          (view) => view.employeeId === employee.id,
        );
        return {
          employee,
          openLines: lines.filter((view) => view.remainingQuantity > 0).length,
          remaining: lines.reduce(
            (total, view) => total + view.remainingQuantity,
            0,
          ),
        };
      })
      .sort((a, b) => {
        if (a.employee.isActive !== b.employee.isActive) {
          return a.employee.isActive ? -1 : 1;
        }
        return a.employee.name.localeCompare(b.employee.name);
      });
  }, [
    state.employees,
    state.completionEntries,
    assignmentViews,
    search,
    periodFilterActive,
    periodInvalid,
    workedFrom,
    workedTo,
  ]);

  const toggleActive = async (employee: Employee) => {
    const result = await setEmployeeActive(employee.id, !employee.isActive);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      employee.isActive
        ? `${employee.name} deactivated`
        : `${employee.name} reactivated`,
    );
  };

  const clearPeriod = () => {
    setWorkedFrom("");
    setWorkedTo("");
  };

  const dateFilterActive = workedFrom !== "" || workedTo !== "";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative sm:w-64">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employees"
              aria-label="Search employees"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="worked-from" className="text-xs">
                Worked from
              </Label>
              <DateInput
                id="worked-from"
                value={workedFrom}
                onValueChange={setWorkedFrom}
                max={workedTo || undefined}
                placeholder="Start date"
                className="w-44"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="worked-to" className="text-xs">
                Worked to
              </Label>
              <DateInput
                id="worked-to"
                value={workedTo}
                onValueChange={setWorkedTo}
                min={workedFrom || undefined}
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

        <Button
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <PlusIcon />
          Add employee
        </Button>
      </div>

      {periodInvalid ? (
        <p className="text-sm text-destructive">
          The start date must be on or before the end date.
        </p>
      ) : periodFilterActive ? (
        <p className="text-sm text-muted-foreground">
          Employees with assignments or completions between{" "}
          {formatDate(workedFrom)} and {formatDate(workedTo)}.
        </p>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title={
            search || periodFilterActive
              ? "No employees match your filters"
              : "No employees yet"
          }
          description={
            search
              ? "Try a different name."
              : periodFilterActive
                ? "Try a different date range or clear the date filter."
                : "Add the tailors you work with to start assigning articles."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Employee</TableHead>
                <TableHead className="w-40">Phone</TableHead>
                <TableHead className="w-28 text-right">Open lines</TableHead>
                <TableHead className="w-32 text-right">Pending pieces</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-px text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ employee, openLines, remaining }) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                        {initialsOf(employee.name)}
                      </span>
                      <span className="font-medium">{employee.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.phone ?? "—"}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {openLines}
                  </TableCell>
                  <TableCell className="tabular text-right font-medium">
                    {remaining}
                  </TableCell>
                  <TableCell>
                    <Badge variant={employee.isActive ? "success" : "outline"}>
                      {employee.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isSuperAdmin ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLedgerEmployee(employee)}
                        >
                          <ScrollTextIcon />
                          Ledger
                        </Button>
                      ) : null}
                      {employee.isActive ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/assign?employee=${employee.id}`}>
                            Assign
                          </Link>
                        </Button>
                      ) : null}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Edit ${employee.name}`}
                            onClick={() => {
                              setEditing(employee);
                              setDialogOpen(true);
                            }}
                          >
                            <PencilIcon />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit details</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={
                              employee.isActive
                                ? `Deactivate ${employee.name}`
                                : `Reactivate ${employee.name}`
                            }
                            onClick={() => toggleActive(employee)}
                          >
                            {employee.isActive ? (
                              <UserRoundXIcon />
                            ) : (
                              <UserCheckIcon />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {employee.isActive
                            ? "Deactivate (blocked while pieces are pending)"
                            : "Reactivate"}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={editing}
      />
      <EmployeeLedgerDialog
        key={ledgerEmployee?.id ?? "closed"}
        employee={ledgerEmployee}
        open={Boolean(ledgerEmployee)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setLedgerEmployee(undefined);
        }}
      />
    </div>
  );
}
