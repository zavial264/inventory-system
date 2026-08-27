/**
 * Hand-maintained mirror of `supabase/schema.sql`. Keep the two in step when
 * the schema changes.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ArticleSize = "S" | "M" | "L" | "XL";
export type AssignmentStatusRow = "not_started" | "in_progress" | "completed";

type EmployeeRow = {
  id: string;
  name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
};

type ArticleTypeRow = {
  id: string;
  name: string;
  stitching_price: number;
  is_active: boolean;
  created_at: string;
};

type AssignmentRow = {
  id: string;
  employee_id: string;
  article_type_id: string;
  size: ArticleSize;
  quantity_assigned: number;
  unit_price: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type CompletionEntryRow = {
  id: string;
  assignment_id: string;
  quantity: number;
  completed_on: string;
  note: string | null;
  receipt_id: string | null;
  created_at: string;
};

type AssignmentAdjustmentRow = {
  id: string;
  assignment_id: string;
  previous_quantity: number;
  new_quantity: number;
  reason: string | null;
  created_at: string;
};

type ReceiptRow = {
  id: string;
  receipt_no: string;
  employee_id: string;
  snapshot: Json;
  total_pieces: number;
  created_at: string;
};

type AssignmentProgressRow = AssignmentRow & {
  completed_quantity: number;
  remaining_quantity: number;
  unreceipted_quantity: number;
  status: AssignmentStatusRow;
};

export type Database = {
  public: {
    Tables: {
      employees: {
        Row: EmployeeRow;
        Insert: Partial<Pick<EmployeeRow, "id" | "is_active" | "created_at">> &
          Pick<EmployeeRow, "name"> & { phone?: string | null };
        Update: Partial<EmployeeRow>;
        Relationships: [];
      };
      article_types: {
        Row: ArticleTypeRow;
        Insert: Partial<ArticleTypeRow> & Pick<ArticleTypeRow, "name" | "stitching_price">;
        Update: Partial<ArticleTypeRow>;
        Relationships: [];
      };
      assignments: {
        Row: AssignmentRow;
        Insert: Partial<Pick<AssignmentRow, "id" | "notes" | "created_at" | "updated_at">> &
          Pick<
            AssignmentRow,
            "employee_id" | "article_type_id" | "size" | "quantity_assigned" | "unit_price"
          >;
        Update: Partial<AssignmentRow>;
        Relationships: [];
      };
      completion_entries: {
        Row: CompletionEntryRow;
        Insert: Partial<
          Pick<CompletionEntryRow, "id" | "completed_on" | "note" | "receipt_id" | "created_at">
        > &
          Pick<CompletionEntryRow, "assignment_id" | "quantity">;
        Update: Partial<CompletionEntryRow>;
        Relationships: [];
      };
      assignment_adjustments: {
        Row: AssignmentAdjustmentRow;
        Insert: Partial<Pick<AssignmentAdjustmentRow, "id" | "reason" | "created_at">> &
          Pick<
            AssignmentAdjustmentRow,
            "assignment_id" | "previous_quantity" | "new_quantity"
          >;
        Update: Partial<AssignmentAdjustmentRow>;
        Relationships: [];
      };
      receipts: {
        Row: ReceiptRow;
        Insert: Partial<Pick<ReceiptRow, "id" | "created_at">> &
          Pick<ReceiptRow, "receipt_no" | "employee_id" | "snapshot" | "total_pieces">;
        Update: Partial<ReceiptRow>;
        Relationships: [];
      };
    };
    Views: {
      assignment_progress: {
        Row: AssignmentProgressRow;
        Relationships: [];
      };
    };
    Functions: {
      generate_receipt: {
        Args: { p_employee_id: string };
        Returns: ReceiptRow;
      };
      top_up_assignment: {
        Args: {
          p_assignment_id: string;
          p_additional: number;
          p_reason?: string | null;
        };
        Returns: AssignmentRow;
      };
    };
    Enums: {
      article_size: ArticleSize;
    };
    CompositeTypes: Record<never, never>;
  };
};
