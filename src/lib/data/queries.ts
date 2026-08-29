import "server-only";

import {
  toAdjustment,
  toArticleType,
  toCompletionEntry,
  toEmployee,
  toReceipt,
} from "@/lib/data/mappers";
import {
  ensureFreshSession,
  failQuery,
  isClockSkewError,
  withClockSkewRetry,
} from "@/lib/supabase/clock-skew";
import { createClient } from "@/lib/supabase/server";
import type {
  ArticleType,
  AssignmentAdjustment,
  AssignmentView,
  CompletionEntry,
  Employee,
  Receipt,
} from "@/lib/types";

export type InventorySnapshot = {
  employees: Employee[];
  articleTypes: ArticleType[];
  assignments: AssignmentView[];
  completionEntries: CompletionEntry[];
  adjustments: AssignmentAdjustment[];
  receipts: Receipt[];
};

type Client = Awaited<ReturnType<typeof createClient>>;

function fetchSnapshotTables(supabase: Client) {
  return Promise.all([
    supabase.from("employees").select("*").order("name"),
    supabase.from("article_types").select("*").order("name"),
    supabase
      .from("assignment_progress")
      .select("*")
      .order("updated_at", { ascending: false }),
    supabase
      .from("completion_entries")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("assignment_adjustments")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("receipts")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);
}

function hasClockSkewError(
  results: Awaited<ReturnType<typeof fetchSnapshotTables>>,
) {
  return results.some(
    (result) => result.error && isClockSkewError(result.error.message),
  );
}

export async function getInventorySnapshot(
  client?: Client,
): Promise<InventorySnapshot> {
  const supabase = client ?? (await createClient());

  const results = await withClockSkewRetry(
    async () => {
      await ensureFreshSession(supabase);
      return fetchSnapshotTables(supabase);
    },
    hasClockSkewError,
  );

  const [employees, articleTypes, progress, completions, adjustments, receipts] =
    results;

  if (employees.error) failQuery("employees", employees.error.message);
  if (articleTypes.error) failQuery("articles", articleTypes.error.message);
  if (progress.error) failQuery("assignments", progress.error.message);
  if (completions.error) failQuery("completions", completions.error.message);
  if (adjustments.error) failQuery("adjustments", adjustments.error.message);
  if (receipts.error) failQuery("receipts", receipts.error.message);

  const employeeList = (employees.data ?? []).map(toEmployee);
  const articleList = (articleTypes.data ?? []).map(toArticleType);

  const employeeById = new Map(employeeList.map((item) => [item.id, item]));
  const articleById = new Map(articleList.map((item) => [item.id, item]));

  const assignments = (progress.data ?? []).flatMap<AssignmentView>((row) => {
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

  return {
    employees: employeeList,
    articleTypes: articleList,
    assignments,
    completionEntries: (completions.data ?? []).map(toCompletionEntry),
    adjustments: (adjustments.data ?? []).map(toAdjustment),
    receipts: (receipts.data ?? []).map(toReceipt),
  };
}

export async function getReceipt(id: string): Promise<Receipt | null> {
  const supabase = await createClient();

  const { data, error } = await withClockSkewRetry(
    async () => {
      await ensureFreshSession(supabase);
      return supabase.from("receipts").select("*").eq("id", id).maybeSingle();
    },
    (result) => Boolean(result.error && isClockSkewError(result.error.message)),
  );

  if (error) failQuery("receipt", error.message);
  return data ? toReceipt(data) : null;
}
