import type { Database } from "@/lib/supabase/database.types";
import type {
  ArticleType,
  AssignmentAdjustment,
  CompletionEntry,
  Employee,
  LedgerEntry,
  Receipt,
  ReceiptLine,
} from "@/lib/types";

type Tables = Database["public"]["Tables"];

export function toEmployee(row: Tables["employees"]["Row"]): Employee {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export function toArticleType(
  row: Tables["article_types"]["Row"],
): ArticleType {
  return {
    id: row.id,
    name: row.name,
    stitchingPrice: Number(row.stitching_price),
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export function toCompletionEntry(
  row: Tables["completion_entries"]["Row"],
): CompletionEntry {
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    quantity: row.quantity,
    completedOn: row.completed_on,
    note: row.note,
    receiptId: row.receipt_id,
    createdAt: row.created_at,
  };
}

export function toAdjustment(
  row: Tables["assignment_adjustments"]["Row"],
): AssignmentAdjustment {
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    previousQuantity: row.previous_quantity,
    newQuantity: row.new_quantity,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

export function toReceipt(row: Tables["receipts"]["Row"]): Receipt {
  const snapshot = (row.snapshot ?? {}) as {
    employeeName?: string;
    lines?: Array<{
      articleName: string;
      size: ReceiptLine["size"];
      quantity: number;
      unitPrice?: number;
      lineTotal?: number;
    }>;
    totalAmount?: number;
  };

  const lines: ReceiptLine[] = (snapshot.lines ?? []).map((line) => ({
    articleName: line.articleName,
    size: line.size,
    quantity: line.quantity,
    unitPrice:
      line.unitPrice != null ? Number(line.unitPrice) : undefined,
    lineTotal:
      line.lineTotal != null ? Number(line.lineTotal) : undefined,
  }));

  const totalAmount =
    row.total_amount != null
      ? Number(row.total_amount)
      : snapshot.totalAmount != null
        ? Number(snapshot.totalAmount)
        : null;

  return {
    id: row.id,
    receiptNo: row.receipt_no,
    employeeId: row.employee_id,
    snapshot: {
      employeeName: snapshot.employeeName ?? "",
      lines,
      totalAmount: totalAmount ?? undefined,
    },
    totalPieces: row.total_pieces,
    totalAmount,
    createdAt: row.created_at,
  };
}

export function toLedgerEntry(row: Tables["employee_ledger"]["Row"]): LedgerEntry {
  return {
    id: row.id,
    employeeId: row.employee_id,
    completionEntryId: row.completion_entry_id,
    assignmentId: row.assignment_id,
    articleTypeId: row.article_type_id,
    articleName: row.article_name,
    size: row.size,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    amount: Number(row.amount),
    occurredOn: row.occurred_on,
    createdAt: row.created_at,
  };
}
