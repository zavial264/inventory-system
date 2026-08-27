"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  CheckCircle2Icon,
  InfoIcon,
  LockIcon,
  UserPlusIcon,
} from "lucide-react";

import { EmployeeDialog } from "@/components/employees/employee-dialog";
import { FormField } from "@/components/form/form-field";
import { TopUpDialog } from "@/components/tracking/top-up-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import { assignmentSchema, type AssignmentInput } from "@/lib/schemas";
import { useInventory } from "@/lib/store/inventory-provider";
import { SIZES } from "@/lib/types";

export function AssignmentForm({
  defaultEmployeeId,
}: {
  defaultEmployeeId?: string;
}) {
  const { state, assignmentViews, createAssignment } = useInventory();
  const [employeeDialogOpen, setEmployeeDialogOpen] = React.useState(false);
  const [topUpTargetId, setTopUpTargetId] = React.useState<string | null>(null);
  const [savedOnce, setSavedOnce] = React.useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentInput>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      employeeId: defaultEmployeeId ?? "",
      articleTypeId: "",
      quantityAssigned: undefined,
      size: undefined,
      notes: "",
    },
  });

  const employeeId = useWatch({ control, name: "employeeId" });
  const articleTypeId = useWatch({ control, name: "articleTypeId" });
  const size = useWatch({ control, name: "size" });
  const quantity = useWatch({ control, name: "quantityAssigned" });

  const activeEmployees = React.useMemo(
    () => state.employees.filter((employee) => employee.isActive),
    [state.employees],
  );

  const activeArticles = React.useMemo(
    () => state.articleTypes.filter((article) => article.isActive),
    [state.articleTypes],
  );

  const selectedArticle = activeArticles.find(
    (article) => article.id === articleTypeId,
  );

  const validQuantity =
    typeof quantity === "number" && Number.isFinite(quantity) && quantity > 0
      ? quantity
      : 0;

  const lineValue = selectedArticle
    ? selectedArticle.stitchingPrice * validQuantity
    : 0;

  const duplicate = React.useMemo(() => {
    if (!employeeId || !articleTypeId || !size) return null;
    return (
      assignmentViews.find(
        (view) =>
          view.employeeId === employeeId &&
          view.articleTypeId === articleTypeId &&
          view.size === size &&
          view.remainingQuantity > 0,
      ) ?? null
    );
  }, [assignmentViews, employeeId, articleTypeId, size]);

  /** Clears the article line but keeps the employee, ready for their next article. */
  const resetForNextArticle = (keepEmployeeId: string) => {
    reset({
      employeeId: keepEmployeeId,
      articleTypeId: "",
      quantityAssigned: undefined,
      size: undefined,
      notes: "",
    });
  };

  const onSubmit = async (values: AssignmentInput) => {
    const result = await createAssignment(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    const employee = state.employees.find((item) => item.id === values.employeeId);
    const article = state.articleTypes.find(
      (item) => item.id === values.articleTypeId,
    );

    toast.success(
      `${values.quantityAssigned} ${article?.name ?? "articles"} (${values.size}) assigned to ${employee?.name ?? "employee"}`,
    );

    setSavedOnce(true);
    resetForNextArticle(values.employeeId);
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Who is doing the work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-0">
              <FormField
                label="Employee"
                htmlFor="employeeId"
                required
                error={errors.employeeId?.message}
              >
                <div className="flex gap-2">
                  <Controller
                    control={control}
                    name="employeeId"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="employeeId"
                          aria-invalid={Boolean(errors.employeeId)}
                        >
                          <SelectValue placeholder="Select an employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeEmployees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEmployeeDialogOpen(true)}
                  >
                    <UserPlusIcon />
                    New
                  </Button>
                </div>
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What they are stitching</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-0">
              <FormField
                label="Article"
                htmlFor="articleTypeId"
                required
                error={errors.articleTypeId?.message}
              >
                <Controller
                  control={control}
                  name="articleTypeId"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="articleTypeId"
                        aria-invalid={Boolean(errors.articleTypeId)}
                      >
                        <SelectValue placeholder="Select an article" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeArticles.map((article) => (
                          <SelectItem key={article.id} value={article.id}>
                            {article.name} — {formatCurrency(article.stitchingPrice)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label="Number of articles"
                  htmlFor="quantityAssigned"
                  required
                  error={errors.quantityAssigned?.message}
                >
                  <Controller
                    control={control}
                    name="quantityAssigned"
                    render={({ field }) => (
                      <Input
                        id="quantityAssigned"
                        type="number"
                        min={1}
                        inputMode="numeric"
                        placeholder="e.g. 25"
                        aria-invalid={Boolean(errors.quantityAssigned)}
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={Number.isFinite(field.value) ? field.value : ""}
                        onChange={(event) => {
                          const next = event.target.value;
                          field.onChange(next === "" ? undefined : Number(next));
                        }}
                      />
                    )}
                  />
                </FormField>

                <FormField
                  label="Size"
                  htmlFor="size"
                  required
                  error={errors.size?.message}
                >
                  <Controller
                    control={control}
                    name="size"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="size"
                          aria-invalid={Boolean(errors.size)}
                        >
                          <SelectValue placeholder="Select a size" />
                        </SelectTrigger>
                        <SelectContent>
                          {SIZES.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
              </div>

              <FormField
                label="Stitching rate"
                htmlFor="stitchingRate"
                hint="Set in Articles & Rates, and locked to this assignment once saved"
              >
                <div className="relative">
                  <Input
                    id="stitchingRate"
                    readOnly
                    disabled
                    value={
                      selectedArticle
                        ? formatCurrency(selectedArticle.stitchingPrice)
                        : ""
                    }
                    placeholder="Select an article first"
                    className="pr-9 font-medium"
                  />
                  <LockIcon className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
              </FormField>

              <FormField
                label="Notes"
                htmlFor="notes"
                hint="Optional, e.g. lot or order reference"
                error={errors.notes?.message}
              >
                <Textarea
                  id="notes"
                  rows={2}
                  placeholder="e.g. Wedding order, lot A"
                  {...register("notes")}
                />
              </FormField>
            </CardContent>
          </Card>

          {duplicate ? (
            <div className="flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <InfoIcon className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
                <div className="space-y-0.5 text-sm">
                  <p className="font-medium">
                    {duplicate.employee.name} already has an open line for{" "}
                    {duplicate.articleType.name} ({duplicate.size})
                  </p>
                  <p className="text-muted-foreground">
                    {duplicate.remainingQuantity} of{" "}
                    {duplicate.quantityAssigned} still pending. Top it up to keep
                    one line, or add a separate line to track this batch on its
                    own.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={() => setTopUpTargetId(duplicate.id)}
              >
                Top up existing
              </Button>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {duplicate ? "Add as a new line" : "Assign work"}
            </Button>
            <Button type="button" variant="ghost" asChild>
              <Link href="/tracking">Go to tracking</Link>
            </Button>
          </div>
        </form>

        <div className="space-y-4 lg:sticky lg:top-8">
          <Card>
            <CardHeader>
              <CardTitle>Assignment summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-sm">
              <SummaryRow
                label="Employee"
                value={
                  state.employees.find((item) => item.id === employeeId)?.name
                }
              />
              <SummaryRow label="Article" value={selectedArticle?.name} />
              <SummaryRow label="Size" value={size} />
              <SummaryRow
                label="Quantity"
                value={validQuantity ? String(validQuantity) : undefined}
              />
              <SummaryRow
                label="Rate per piece"
                value={
                  selectedArticle
                    ? formatCurrency(selectedArticle.stitchingPrice)
                    : undefined
                }
              />
              <Separator className="my-1" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Line value</span>
                <span className="tabular text-base font-semibold">
                  {formatCurrency(lineValue)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Shown for your reference only. Receipts carry quantities, never
                amounts.
              </p>
            </CardContent>
          </Card>

          {savedOnce ? (
            <div className="flex gap-3 rounded-xl border border-success/30 bg-success/10 p-4 text-sm">
              <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-success" />
              <div className="space-y-2">
                <p className="font-medium">Assignment saved</p>
                <p className="text-muted-foreground">
                  The employee is still selected so you can assign the next
                  article straight away.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/tracking">View on tracking</Link>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <EmployeeDialog
        open={employeeDialogOpen}
        onOpenChange={setEmployeeDialogOpen}
        onSaved={(employee) =>
          setValue("employeeId", employee.id, { shouldValidate: true })
        }
      />

      <TopUpDialog
        assignmentId={topUpTargetId}
        open={Boolean(topUpTargetId)}
        onOpenChange={(open) => {
          if (!open) setTopUpTargetId(null);
        }}
        onToppedUp={() => {
          setSavedOnce(true);
          resetForNextArticle(employeeId);
        }}
      />
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={value ? "font-medium" : "text-muted-foreground"}>
        {value ?? "—"}
      </span>
    </div>
  );
}
