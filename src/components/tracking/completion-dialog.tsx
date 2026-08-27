"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormField } from "@/components/form/form-field";
import { AssignmentSummary } from "@/components/tracking/assignment-summary";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toDateInputValue } from "@/lib/format";
import { completionSchema, type CompletionInput } from "@/lib/schemas";
import { useInventory } from "@/lib/store/inventory-provider";
import type { AssignmentView } from "@/lib/types";

export function CompletionDialog({
  assignmentId,
  open,
  onOpenChange,
}: {
  assignmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { assignmentViews, recordCompletion } = useInventory();
  const assignment: AssignmentView | null =
    assignmentViews.find((view) => view.id === assignmentId) ?? null;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CompletionInput>({
    resolver: zodResolver(completionSchema),
    defaultValues: { quantity: 1, completedOn: toDateInputValue(), note: "" },
  });

  React.useEffect(() => {
    if (!open) return;
    reset({ quantity: 1, completedOn: toDateInputValue(), note: "" });
  }, [open, assignmentId, reset]);

  if (!assignment) return null;

  const remaining = assignment.remainingQuantity;

  const onSubmit = async (values: CompletionInput) => {
    const result = await recordCompletion(assignment.id, values);
    if (!result.ok) {
      setError("quantity", { message: result.error });
      return;
    }

    toast.success(
      `${values.quantity} ${assignment.articleType.name} (${assignment.size}) recorded for ${assignment.employee.name}`,
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record completed pieces</DialogTitle>
          <DialogDescription>
            Log what the employee has handed back. The remaining count updates
            straight away.
          </DialogDescription>
        </DialogHeader>

        <AssignmentSummary assignment={assignment} />

        <form
          id="completion-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormField
            label="Pieces completed now"
            htmlFor="completion-quantity"
            required
            error={errors.quantity?.message}
            hint={`Maximum ${remaining} (the remaining balance on this line)`}
          >
            <div className="flex gap-2">
              <Input
                id="completion-quantity"
                type="number"
                min={1}
                max={remaining}
                inputMode="numeric"
                autoFocus
                aria-invalid={Boolean(errors.quantity)}
                {...register("quantity", { valueAsNumber: true })}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setValue("quantity", remaining, { shouldValidate: true })
                }
                disabled={remaining <= 0}
              >
                All {remaining}
              </Button>
            </div>
          </FormField>

          <FormField
            label="Completed on"
            htmlFor="completion-date"
            required
            error={errors.completedOn?.message}
          >
            <Input
              id="completion-date"
              type="date"
              max={toDateInputValue()}
              aria-invalid={Boolean(errors.completedOn)}
              {...register("completedOn")}
            />
          </FormField>

          <FormField
            label="Note"
            htmlFor="completion-note"
            hint="Optional"
            error={errors.note?.message}
          >
            <Textarea
              id="completion-note"
              rows={2}
              placeholder="e.g. Second batch, rest pending"
              {...register("note")}
            />
          </FormField>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="completion-form"
            disabled={remaining <= 0 || isSubmitting}
          >
            Record completion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
