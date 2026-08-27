import type { Database } from "@/lib/supabase/database.types";
import type {
  ArticleType,
  AssignmentAdjustment,
  CompletionEntry,
  Employee,
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
    lines?: ReceiptLine[];
  };

  return {
    id: row.id,
    receiptNo: row.receipt_no,
    employeeId: row.employee_id,
    snapshot: {
      employeeName: snapshot.employeeName ?? "",
      lines: snapshot.lines ?? [],
    },
    totalPieces: row.total_pieces,
    createdAt: row.created_at,
  };
}
