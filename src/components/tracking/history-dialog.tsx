"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  HistoryIcon,
  PackageCheckIcon,
  TrendingUpIcon,
  Undo2Icon,
} from "lucide-react";

import { FormField } from "@/components/form/form-field";
import { AssignmentSummary } from "@/components/tracking/assignment-summary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import {
  fetchAssignmentHistoryAction,
  reverseCompletionAction,
} from "@/lib/data/actions";
import type { AssignmentHistory } from "@/lib/data/queries";
import { formatDate } from "@/lib/format";
import { reversalSchema, type ReversalInput } from "@/lib/schemas";
import { useInventory } from "@/lib/store/inventory-provider";
import type { AssignmentView } from "@/lib/types";

type TimelineItem = {
  id: string;
  at: string;
  kind: "completion" | "reversal" | "adjustment";
  title: string;
  detail: string | null;
  receipted: boolean;
};

function buildTimeline(
  assignmentId: string,
  history: AssignmentHistory,
): TimelineItem[] {
  const completions = history.completionEntries.map<TimelineItem>((entry) => ({
    id: entry.id,
    at: entry.createdAt,
    kind: entry.quantity < 0 ? "reversal" : "completion",
    title:
      entry.quantity < 0
        ? `${Math.abs(entry.quantity)} pieces reversed`
        : `${entry.quantity} pieces completed`,
    detail: entry.receiptId
      ? [
          entry.note,
          `On receipt ${history.receiptNumbers[entry.receiptId] ?? ""}`,
        ]
          .filter(Boolean)
          .join(" · ")
      : entry.note,
    receipted: Boolean(entry.receiptId),
  }));

  const adjustments = history.adjustments
    .filter((item) => item.assignmentId === assignmentId)
    .map<TimelineItem>((item) => ({
      id: item.id,
      at: item.createdAt,
      kind: "adjustment",
      title: `Assigned raised from ${item.previousQuantity} to ${item.newQuantity}`,
      detail: item.reason,
      receipted: false,
    }));

  return [...completions, ...adjustments].sort((a, b) =>
    b.at.localeCompare(a.at),
  );
}

export function HistoryDialog({
  assignmentId,
  open,
  onOpenChange,
}: {
  assignmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { assignmentViews } = useInventory();
  const assignment: AssignmentView | null =
    assignmentViews.find((view) => view.id === assignmentId) ?? null;
  const [reversing, setReversing] = React.useState(false);
  const [history, setHistory] = React.useState<AssignmentHistory | null>(null);
  const [loadedFor, setLoadedFor] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ReversalInput>({
    resolver: zodResolver(reversalSchema),
    defaultValues: { quantity: 1, reason: "" },
  });

  const loadHistory = React.useCallback(async (id: string) => {
    const result = await fetchAssignmentHistoryAction(id);
    if (result.ok) {
      setHistory(result.data);
      setLoadedFor(id);
    } else {
      toast.error(result.error);
      setHistory(null);
      setLoadedFor(null);
    }
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setReversing(false);
      setHistory(null);
      setLoadedFor(null);
      reset({ quantity: 1, reason: "" });
    }
    onOpenChange(next);
  };

  React.useEffect(() => {
    if (!open || !assignmentId) return;
    // Data loads when the dialog opens for a new line.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-open
    void loadHistory(assignmentId);
  }, [open, assignmentId, loadHistory]);

  const loading = Boolean(open && assignmentId && loadedFor !== assignmentId);

  const timeline = history && assignment ? buildTimeline(assignment.id, history) : [];

  if (!assignment) return null;

  const onSubmit = async (values: ReversalInput) => {
    const result = await reverseCompletionAction(assignment.id, values);
    if (!result.ok) {
      setError("quantity", { message: result.error });
      return;
    }

    toast.success(`${values.quantity} pieces reversed`);
    setReversing(false);
    reset({ quantity: 1, reason: "" });
    await loadHistory(assignment.id);
  };

  const iconFor = (kind: TimelineItem["kind"]) => {
    if (kind === "adjustment") return TrendingUpIcon;
    if (kind === "reversal") return Undo2Icon;
    return PackageCheckIcon;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Line history</DialogTitle>
          <DialogDescription>
            Every hand-in and quantity change on this line, newest first.
          </DialogDescription>
        </DialogHeader>

        <AssignmentSummary assignment={assignment} />

        <div className="max-h-72 overflow-y-auto pr-1">
          {loading ? (
            <LoadingState rows={3} />
          ) : timeline.length === 0 ? (
            <EmptyState
              icon={HistoryIcon}
              title="Nothing recorded yet"
              description="Completions and quantity changes will appear here."
              className="py-10"
            />
          ) : (
            <ol className="space-y-3">
              {timeline.map((item) => {
                const Icon = iconFor(item.kind);
                return (
                  <li key={item.id} className="flex gap-3">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Icon className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{item.title}</p>
                        {item.receipted ? (
                          <Badge variant="outline">Receipted</Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.at)}
                        {item.detail ? ` · ${item.detail}` : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {reversing ? (
          <form
            id="reversal-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
          >
            <p className="text-sm font-medium">Reverse a completion</p>
            <p className="-mt-3 text-xs text-muted-foreground">
              Entries are never edited. A reversal posts a negative correction
              that stays on the record.
            </p>

            <FormField
              label="Pieces to reverse"
              htmlFor="reversal-quantity"
              required
              error={errors.quantity?.message}
            >
              <Input
                id="reversal-quantity"
                type="number"
                min={1}
                max={assignment.completedQuantity}
                autoFocus
                aria-invalid={Boolean(errors.quantity)}
                {...register("quantity", { valueAsNumber: true })}
              />
            </FormField>

            <FormField
              label="Reason"
              htmlFor="reversal-reason"
              required
              error={errors.reason?.message}
            >
              <Input
                id="reversal-reason"
                placeholder="e.g. Counted 12 by mistake, actual was 10"
                aria-invalid={Boolean(errors.reason)}
                {...register("reason")}
              />
            </FormField>
          </form>
        ) : null}

        <DialogFooter className="sm:justify-between">
          {reversing ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setReversing(false)}
              >
                Cancel reversal
              </Button>
              <Button
                type="submit"
                form="reversal-form"
                variant="destructive"
                disabled={isSubmitting}
              >
                Post reversal
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setReversing(true)}
                disabled={assignment.completedQuantity <= 0 || loading}
              >
                <Undo2Icon />
                Reverse a completion
              </Button>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
