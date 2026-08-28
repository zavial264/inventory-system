import "server-only";

import { cache } from "react";

import {
  toAdjustment,
  toArticleType,
  toCompletionEntry,
  toEmployee,
  toReceipt,
} from "@/lib/data/mappers";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type {
  ArticleType,
  AssignmentAdjustment,
  AssignmentView,
  CompletionEntry,
  Employee,
  Receipt,
} from "@/lib/types";

/** Loaded on every app page — three small tables plus the progress view. */
export type CoreSnapshot = {
  employees: Employee[];
  articleTypes: ArticleType[];
  assignments: AssignmentView[];
};

function failed(label: string, message: string): never {
  throw new Error(`Could not load ${label}: ${message}`);
}

function buildAssignments(
  progress: Database["public"]["Views"]["assignment_progress"]["Row"][] | null,
  employeeList: Employee[],
  articleList: ArticleType[],
): AssignmentView[] {
  const employeeById = new Map(employeeList.map((item) => [item.id, item]));
  const articleById = new Map(articleList.map((item) => [item.id, item]));

  return (progress ?? []).flatMap<AssignmentView>((row) => {
    const employee = employeeById.get(row.employee_id);
    const articleType = articleById.get(row.article_type_id);
    if (!employee || !articleType) return [];

    return [
      {
        id: row.id,
        employeeId: row.employee_id,
        articleTypeId: row.article_type_id,
        size: row.size,
        quantityAssigned: row.quantity_assigned,
        unitPrice: Number(row.unit_price),
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        employee,
        articleType,
        completedQuantity: row.completed_quantity,
        remainingQuantity: row.remaining_quantity,
        unreceiptedQuantity: row.unreceipted_quantity,
        status: row.status,
      },
    ];
  });
}

/** Deduped within a single request — safe to call from layout and pages. */
export const getCoreSnapshot = cache(async (): Promise<CoreSnapshot> => {
  const supabase = await createClient();

  const [employees, articleTypes, progress] = await Promise.all([
    supabase.from("employees").select("*").order("name"),
    supabase.from("article_types").select("*").order("name"),
    supabase
      .from("assignment_progress")
      .select("*")
      .order("updated_at", { ascending: false }),
  ]);

  if (employees.error) failed("employees", employees.error.message);
  if (articleTypes.error) failed("articles", articleTypes.error.message);
  if (progress.error) failed("assignments", progress.error.message);

  const employeeList = (employees.data ?? []).map(toEmployee);
  const articleList = (articleTypes.data ?? []).map(toArticleType);

  return {
    employees: employeeList,
    articleTypes: articleList,
    assignments: buildAssignments(progress.data, employeeList, articleList),
  };
});

export const getReceiptsList = cache(async (): Promise<Receipt[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) failed("receipts", error.message);
  return (data ?? []).map(toReceipt);
});

export type AssignmentHistory = {
  completionEntries: CompletionEntry[];
  adjustments: AssignmentAdjustment[];
  receiptNumbers: Record<string, string>;
};

export async function getAssignmentHistory(
  assignmentId: string,
): Promise<AssignmentHistory> {
  const supabase = await createClient();

  const [completions, adjustments] = await Promise.all([
    supabase
      .from("completion_entries")
      .select("*")
      .eq("assignment_id", assignmentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("assignment_adjustments")
      .select("*")
      .eq("assignment_id", assignmentId)
      .order("created_at", { ascending: false }),
  ]);

  if (completions.error) failed("completions", completions.error.message);
  if (adjustments.error) failed("adjustments", adjustments.error.message);

  const completionEntries = (completions.data ?? []).map(toCompletionEntry);
  const receiptIds = [
    ...new Set(
      completionEntries
        .map((entry) => entry.receiptId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  let receiptNumbers: Record<string, string> = {};
  if (receiptIds.length > 0) {
    const { data, error } = await supabase
      .from("receipts")
      .select("id, receipt_no")
      .in("id", receiptIds);

    if (error) failed("receipts", error.message);
    receiptNumbers = Object.fromEntries(
      (data ?? []).map((row) => [row.id, row.receipt_no]),
    );
  }

  return {
    completionEntries,
    adjustments: (adjustments.data ?? []).map(toAdjustment),
    receiptNumbers,
  };
}

export async function getReceipt(id: string): Promise<Receipt | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) failed("receipt", error.message);
  return data ? toReceipt(data) : null;
}
