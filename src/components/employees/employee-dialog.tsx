"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormField } from "@/components/form/form-field";
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
import { employeeSchema, type EmployeeInput } from "@/lib/schemas";
import { useInventory } from "@/lib/store/inventory-provider";
import type { Employee } from "@/lib/types";

export function EmployeeDialog({
  open,
  onOpenChange,
  employee,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee;
  onSaved?: (employee: Employee) => void;
}) {
  const { createEmployee, updateEmployee } = useInventory();
  const isEdit = Boolean(employee);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeInput>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { name: "", phone: "" },
  });

  React.useEffect(() => {
    if (!open) return;
    reset({ name: employee?.name ?? "", phone: employee?.phone ?? "" });
  }, [open, employee, reset]);

  const onSubmit = async (values: EmployeeInput) => {
    if (employee) {
      const result = await updateEmployee(employee.id, values);
      if (!result.ok) {
        setError("name", { message: result.error });
        return;
      }
      toast.success(`${values.name.trim()} updated`);
      onOpenChange(false);
      return;
    }

    const result = await createEmployee(values);
    if (!result.ok) {
      setError("name", { message: result.error });
      return;
    }
    toast.success(`${result.data.name} added`);
    onSaved?.(result.data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit employee" : "New employee"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the tailor's details. Their work history stays intact."
              : "Add a tailor so you can assign articles to them."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="employee-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormField
            label="Full name"
            htmlFor="employee-name"
            required
            error={errors.name?.message}
          >
            <Input
              id="employee-name"
              placeholder="e.g. Arif Hussain"
              autoFocus
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
          </FormField>

          <FormField
            label="Phone"
            htmlFor="employee-phone"
            hint="Optional"
            error={errors.phone?.message}
          >
            <Input
              id="employee-phone"
              placeholder="e.g. 0300 1234567"
              inputMode="tel"
              aria-invalid={Boolean(errors.phone)}
              {...register("phone")}
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
          <Button type="submit" form="employee-form" disabled={isSubmitting}>
            {isEdit ? "Save changes" : "Add employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
