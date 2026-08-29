export const SIZES = ["S", "M", "L", "XL"] as const;
export type Size = (typeof SIZES)[number];

export const APP_ROLES = ["admin", "super_admin"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  super_admin: "Super Admin",
};

export type PlatformUser = {
  id: string;
  email: string;
  role: AppRole;
  invitedAt: string | null;
  createdAt: string;
  lastSignInAt: string | null;
};

export type Employee = {
  id: string;
  name: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
};

export type ArticleType = {
  id: string;
  name: string;
  stitchingPrice: number;
  isActive: boolean;
  createdAt: string;
};

export type Assignment = {
  id: string;
  employeeId: string;
  articleTypeId: string;
  size: Size;
  quantityAssigned: number;
  /**
   * Rate copied from the article catalogue when the assignment is created, so a
   * later price change never rewrites historical work.
   */
  unitPrice: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompletionEntry = {
  id: string;
  assignmentId: string;
  /** Negative only for admin reversals, which correct a mistaken hand-in. */
  quantity: number;
  completedOn: string;
  note: string | null;
  receiptId: string | null;
  createdAt: string;
};

export type AssignmentAdjustment = {
  id: string;
  assignmentId: string;
  previousQuantity: number;
  newQuantity: number;
  reason: string | null;
  createdAt: string;
};

export type ReceiptLine = {
  articleName: string;
  size: Size;
  quantity: number;
};

export type Receipt = {
  id: string;
  receiptNo: string;
  employeeId: string;
  /** Frozen at generation time so a re-print always matches the original slip. */
  snapshot: {
    employeeName: string;
    lines: ReceiptLine[];
  };
  totalPieces: number;
  createdAt: string;
};

export type AssignmentStatus = "not_started" | "in_progress" | "completed";

export type AssignmentView = Assignment & {
  employee: Employee;
  articleType: ArticleType;
  completedQuantity: number;
  remainingQuantity: number;
  /** Completed pieces that have not been included on a receipt yet. */
  unreceiptedQuantity: number;
  status: AssignmentStatus;
};

export type EmployeeGroup = {
  employee: Employee;
  assignments: AssignmentView[];
  totalAssigned: number;
  totalCompleted: number;
  totalRemaining: number;
  unreceiptedPieces: number;
};

export const STATUS_LABELS: Record<AssignmentStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};
