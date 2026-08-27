"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ClipboardListIcon,
  LayersIcon,
  PackageCheckIcon,
  ReceiptTextIcon,
  SearchIcon,
  SearchXIcon,
  TimerIcon,
} from "lucide-react";

import { CompletionDialog } from "@/components/tracking/completion-dialog";
import { EmployeeGroupCard } from "@/components/tracking/employee-group-card";
import { HistoryDialog } from "@/components/tracking/history-dialog";
import { TopUpDialog } from "@/components/tracking/top-up-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { useInventory } from "@/lib/store/inventory-provider";
import { SIZES, type AssignmentStatus } from "@/lib/types";

const ALL = "all";

export function TrackingBoard() {
  const router = useRouter();
  const { state, employeeGroups, generateReceipt } = useInventory();
  const [receiptPending, setReceiptPending] = React.useState<string | null>(
    null,
  );

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<AssignmentStatus | typeof ALL>(ALL);
  const [articleId, setArticleId] = React.useState<string>(ALL);
  const [size, setSize] = React.useState<string>(ALL);

  const [recordTargetId, setRecordTargetId] = React.useState<string | null>(
    null,
  );
  const [historyTargetId, setHistoryTargetId] = React.useState<string | null>(
    null,
  );
  const [topUpTargetId, setTopUpTargetId] = React.useState<string | null>(null);

  const filtersActive =
    search.trim() !== "" || status !== ALL || articleId !== ALL || size !== ALL;

  const visibleGroups = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    return employeeGroups.flatMap((group) => {
      const assignments = group.assignments.filter((assignment) => {
        if (status !== ALL && assignment.status !== status) return false;
        if (articleId !== ALL && assignment.articleTypeId !== articleId) {
          return false;
        }
        if (size !== ALL && assignment.size !== size) return false;
        if (!query) return true;
        return (
          group.employee.name.toLowerCase().includes(query) ||
          assignment.articleType.name.toLowerCase().includes(query)
        );
      });

      if (assignments.length === 0) return [];

      return [
        {
          ...group,
          assignments,
          totalAssigned: assignments.reduce(
            (total, item) => total + item.quantityAssigned,
            0,
          ),
          totalCompleted: assignments.reduce(
            (total, item) => total + item.completedQuantity,
            0,
          ),
          totalRemaining: assignments.reduce(
            (total, item) => total + item.remainingQuantity,
            0,
          ),
        },
      ];
    });
  }, [employeeGroups, search, status, articleId, size]);

  const totals = React.useMemo(() => {
    return employeeGroups.reduce(
      (acc, group) => ({
        assigned: acc.assigned + group.totalAssigned,
        completed: acc.completed + group.totalCompleted,
        remaining: acc.remaining + group.totalRemaining,
        unreceipted: acc.unreceipted + group.unreceiptedPieces,
      }),
      { assigned: 0, completed: 0, remaining: 0, unreceipted: 0 },
    );
  }, [employeeGroups]);

  const handlePrintReceipt = async (employeeId: string) => {
    setReceiptPending(employeeId);
    try {
      const result = await generateReceipt(employeeId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.push(`/receipts/${result.data.id}/print?auto=1`);
    } finally {
      setReceiptPending(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus(ALL);
    setArticleId(ALL);
    setSize(ALL);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Pieces assigned"
          value={totals.assigned}
          icon={LayersIcon}
        />
        <StatCard
          label="Pieces completed"
          value={totals.completed}
          icon={PackageCheckIcon}
          tone="success"
        />
        <StatCard
          label="In progress"
          value={totals.remaining}
          icon={TimerIcon}
          tone="warning"
        />
        <StatCard
          label="Awaiting receipt"
          value={totals.unreceipted}
          icon={ReceiptTextIcon}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by employee or article"
            aria-label="Search assignments"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as AssignmentStatus | typeof ALL)
            }
          >
            <SelectTrigger className="w-36" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              <SelectItem value="not_started">Not started</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={articleId} onValueChange={setArticleId}>
            <SelectTrigger className="w-36" aria-label="Filter by article">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All articles</SelectItem>
              {state.articleTypes.map((article) => (
                <SelectItem key={article.id} value={article.id}>
                  {article.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={size} onValueChange={setSize}>
            <SelectTrigger className="w-28" aria-label="Filter by size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All sizes</SelectItem>
              {SIZES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filtersActive ? (
            <Button variant="ghost" onClick={clearFilters}>
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      {employeeGroups.length === 0 ? (
        <EmptyState
          icon={ClipboardListIcon}
          title="No work assigned yet"
          description="Assign articles to a tailor and their progress will show up here."
          action={
            <Button asChild>
              <Link href="/assign">Assign work</Link>
            </Button>
          }
        />
      ) : visibleGroups.length === 0 ? (
        <EmptyState
          icon={SearchXIcon}
          title="No lines match these filters"
          description="Try a different search term or clear the filters."
          action={
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {visibleGroups.map((group) => (
            <EmployeeGroupCard
              key={group.employee.id}
              group={group}
              onRecord={(assignment) => setRecordTargetId(assignment.id)}
              onHistory={(assignment) => setHistoryTargetId(assignment.id)}
              onTopUp={(assignment) => setTopUpTargetId(assignment.id)}
              onPrintReceipt={handlePrintReceipt}
              receiptPending={receiptPending === group.employee.id}
            />
          ))}
        </div>
      )}

      <CompletionDialog
        assignmentId={recordTargetId}
        open={Boolean(recordTargetId)}
        onOpenChange={(open) => {
          if (!open) setRecordTargetId(null);
        }}
      />

      <HistoryDialog
        assignmentId={historyTargetId}
        open={Boolean(historyTargetId)}
        onOpenChange={(open) => {
          if (!open) setHistoryTargetId(null);
        }}
      />

      <TopUpDialog
        assignmentId={topUpTargetId}
        open={Boolean(topUpTargetId)}
        onOpenChange={(open) => {
          if (!open) setTopUpTargetId(null);
        }}
      />
    </div>
  );
}
