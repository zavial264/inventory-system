"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ArrowRightIcon } from "lucide-react";

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
import { topUpSchema, type TopUpInput } from "@/lib/schemas";
import { useInventory } from "@/lib/store/inventory-provider";
import type { AssignmentView } from "@/lib/types";

export function TopUpDialog({
  assignmentId,
  open,
  onOpenChange,
  onToppedUp,
}: {
  assignmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fires only when pieces were actually added, not when the dialog is dismissed. */
  onToppedUp?: () => void;
}) {
  const { assignmentViews, topUpAssignment } = useInventory();
  const assignment: AssignmentView | null =
    assignmentViews.find((view) => view.id === assignmentId) ?? null;

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TopUpInput>({
    resolver: zodResolver(topUpSchema),
    defaultValues: { additionalQuantity: 1, reason: "" },
  });

  React.useEffect(() => {
    if (!open) return;
    reset({ additionalQuantity: 1, reason: "" });
  }, [open, assignmentId, reset]);

  const additional = useWatch({ control, name: "additionalQuantity" });

  if (!assignment) return null;

  const projected =
    assignment.quantityAssigned +
    (Number.isFinite(additional) && additional > 0 ? additional : 0);

  const onSubmit = async (values: TopUpInput) => {
    const result = await topUpAssignment(assignment.id, values);
    if (!result.ok) {
      setError("additionalQuantity", { message: result.error });
      return;
    }

    toast.success(
      `${values.additionalQuantity} more ${assignment.articleType.name} (${assignment.size}) assigned to ${assignment.employee.name}`,
    );
    onToppedUp?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign more on this line</DialogTitle>
          <DialogDescription>
            Increases the assigned quantity for the same article and size. The
            change is recorded in the line&apos;s history.
          </DialogDescription>
        </DialogHeader>

        <AssignmentSummary assignment={assignment} />

        <form
          id="top-up-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormField
            label="Additional pieces"
            htmlFor="top-up-quantity"
            required
            error={errors.additionalQuantity?.message}
          >
            <Input
              id="top-up-quantity"
              type="number"
              min={1}
              inputMode="numeric"
              autoFocus
              aria-invalid={Boolean(errors.additionalQuantity)}
              {...register("additionalQuantity", { valueAsNumber: true })}
            />
          </FormField>

          <div className="flex items-center justify-center gap-3 rounded-lg bg-muted/50 px-4 py-3 text-sm">
            <span className="tabular text-muted-foreground">
              {assignment.quantityAssigned} assigned
            </span>
            <ArrowRightIcon className="size-4 text-muted-foreground" />
            <span className="tabular font-semibold">{projected} assigned</span>
          </div>

          <FormField
            label="Reason"
            htmlFor="top-up-reason"
            hint="Optional, e.g. client increased the order"
            error={errors.reason?.message}
          >
            <Input
              id="top-up-reason"
              placeholder="Why is the quantity going up?"
              {...register("reason")}
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
          <Button type="submit" form="top-up-form" disabled={isSubmitting}>
            Add to line
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
