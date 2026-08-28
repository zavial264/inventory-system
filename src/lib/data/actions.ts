"use server";

import { revalidatePath } from "next/cache";

import { describeDbError, fail, ok, type ActionResult } from "@/lib/action-result";
import { toEmployee, toReceipt } from "@/lib/data/mappers";
import {
  getAssignmentHistory,
  type AssignmentHistory,
} from "@/lib/data/queries";
import {
  assignmentSchema,
  completionSchema,
  employeeSchema,
  reversalSchema,
  topUpSchema,
  type AssignmentInput,
  type CompletionInput,
  type EmployeeInput,
  type ReversalInput,
  type TopUpInput,
} from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import type { Employee, Receipt } from "@/lib/types";

function refresh() {
  revalidatePath("/", "layout");
}

function firstIssue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Please check the details and try again";
}

export async function createEmployeeAction(
  input: EmployeeInput,
): Promise<ActionResult<Employee>> {
  const parsed = employeeSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .insert({
      name: parsed.data.name.trim(),
      phone: parsed.data.phone?.trim() ? parsed.data.phone.trim() : null,
    })
    .select("*")
    .single();

  if (error) {
    return fail(
      error.code === "23505"
        ? "An employee with this name already exists"
        : describeDbError(error),
    );
  }

  refresh();
  return ok(toEmployee(data));
}

export async function updateEmployeeAction(
  id: string,
  input: EmployeeInput,
): Promise<ActionResult> {
  const parsed = employeeSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({
      name: parsed.data.name.trim(),
      phone: parsed.data.phone?.trim() ? parsed.data.phone.trim() : null,
    })
    .eq("id", id);

  if (error) {
    return fail(
      error.code === "23505"
        ? "An employee with this name already exists"
        : describeDbError(error),
    );
  }

  refresh();
  return ok(undefined);
}

export async function setEmployeeActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();

  if (!isActive) {
    const { data, error } = await supabase
      .from("assignment_progress")
      .select("remaining_quantity")
      .eq("employee_id", id);

    if (error) return fail(describeDbError(error));

    const remaining = (data ?? []).reduce(
      (total, row) => total + row.remaining_quantity,
      0,
    );

    if (remaining > 0) {
      return fail(
        `Cannot deactivate: ${remaining} piece${remaining === 1 ? "" : "s"} still pending with this employee`,
      );
    }
  }

  const { error } = await supabase
    .from("employees")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return fail(describeDbError(error));

  refresh();
  return ok(undefined);
}

export async function createAssignmentAction(
  input: AssignmentInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const supabase = await createClient();

  // The rate is read server-side and snapshotted, so a tampered client payload
  // cannot set its own price.
  const { data: article, error: articleError } = await supabase
    .from("article_types")
    .select("stitching_price, is_active")
    .eq("id", parsed.data.articleTypeId)
    .maybeSingle();

  if (articleError) return fail(describeDbError(articleError));
  if (!article) return fail("That article no longer exists");
  if (!article.is_active) return fail("That article is no longer available");

  const { data, error } = await supabase
    .from("assignments")
    .insert({
      employee_id: parsed.data.employeeId,
      article_type_id: parsed.data.articleTypeId,
      size: parsed.data.size,
      quantity_assigned: parsed.data.quantityAssigned,
      unit_price: article.stitching_price,
      notes: parsed.data.notes?.trim() ? parsed.data.notes.trim() : null,
    })
    .select("id")
    .single();

  if (error) return fail(describeDbError(error));

  refresh();
  return ok({ id: data.id });
}

export async function topUpAssignmentAction(
  assignmentId: string,
  input: TopUpInput,
): Promise<ActionResult> {
  const parsed = topUpSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase.rpc("top_up_assignment", {
    p_assignment_id: assignmentId,
    p_additional: parsed.data.additionalQuantity,
    p_reason: parsed.data.reason?.trim() ? parsed.data.reason.trim() : null,
  });

  if (error) return fail(describeDbError(error));

  refresh();
  return ok(undefined);
}

export async function recordCompletionAction(
  assignmentId: string,
  input: CompletionInput,
): Promise<ActionResult> {
  const parsed = completionSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const supabase = await createClient();

  const { data: progress, error: progressError } = await supabase
    .from("assignment_progress")
    .select("remaining_quantity")
    .eq("id", assignmentId)
    .maybeSingle();

  if (progressError) return fail(describeDbError(progressError));
  if (!progress) return fail("That assignment no longer exists");

  if (parsed.data.quantity > progress.remaining_quantity) {
    const remaining = progress.remaining_quantity;
    return fail(
      `Only ${remaining} piece${remaining === 1 ? "" : "s"} remain on this line`,
    );
  }

  const { error } = await supabase.from("completion_entries").insert({
    assignment_id: assignmentId,
    quantity: parsed.data.quantity,
    completed_on: parsed.data.completedOn,
    note: parsed.data.note?.trim() ? parsed.data.note.trim() : null,
  });

  if (error) return fail(describeDbError(error));

  refresh();
  return ok(undefined);
}

export async function reverseCompletionAction(
  assignmentId: string,
  input: ReversalInput,
): Promise<ActionResult> {
  const parsed = reversalSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const supabase = await createClient();

  const { data: progress, error: progressError } = await supabase
    .from("assignment_progress")
    .select("completed_quantity")
    .eq("id", assignmentId)
    .maybeSingle();

  if (progressError) return fail(describeDbError(progressError));
  if (!progress) return fail("That assignment no longer exists");

  if (parsed.data.quantity > progress.completed_quantity) {
    const completed = progress.completed_quantity;
    return fail(
      `Only ${completed} piece${completed === 1 ? "" : "s"} have been recorded as completed`,
    );
  }

  const { error } = await supabase.from("completion_entries").insert({
    assignment_id: assignmentId,
    quantity: -parsed.data.quantity,
    note: `Reversal: ${parsed.data.reason.trim()}`,
  });

  if (error) return fail(describeDbError(error));

  refresh();
  return ok(undefined);
}

export async function generateReceiptAction(
  employeeId: string,
): Promise<ActionResult<Receipt>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("generate_receipt", {
    p_employee_id: employeeId,
  });

  if (error) return fail(describeDbError(error));
  if (!data) return fail("No completed pieces are waiting to be receipted");

  refresh();
  return ok(toReceipt(data));
}

export async function fetchAssignmentHistoryAction(
  assignmentId: string,
): Promise<ActionResult<AssignmentHistory>> {
  try {
    const history = await getAssignmentHistory(assignmentId);
    return ok(history);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load line history";
    return fail(message);
  }
}
