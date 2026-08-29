"use client";

import * as React from "react";

import type { ActionResult } from "@/lib/action-result";
import {
  createArticleTypeAction,
  createAssignmentAction,
  createEmployeeAction,
  generateReceiptAction,
  recordCompletionAction,
  reverseCompletionAction,
  setArticleTypeActiveAction,
  setEmployeeActiveAction,
  topUpAssignmentAction,
  updateArticleTypeAction,
  updateEmployeeAction,
} from "@/lib/data/actions";
import type { InventorySnapshot } from "@/lib/data/queries";
import { groupByEmployee } from "@/lib/derive";
import type {
  ArticleInput,
  AssignmentInput,
  CompletionInput,
  EmployeeInput,
  ReversalInput,
  TopUpInput,
} from "@/lib/schemas";
import type {
  AppRole,
  ArticleType,
  AssignmentAdjustment,
  AssignmentView,
  CompletionEntry,
  Employee,
  EmployeeGroup,
  Receipt,
} from "@/lib/types";

type InventoryContextValue = {
  userRole: AppRole;
  isSuperAdmin: boolean;
  state: {
    employees: Employee[];
    articleTypes: ArticleType[];
    completionEntries: CompletionEntry[];
    adjustments: AssignmentAdjustment[];
    receipts: Receipt[];
  };
  assignmentViews: AssignmentView[];
  employeeGroups: EmployeeGroup[];
  createEmployee: (input: EmployeeInput) => Promise<ActionResult<Employee>>;
  updateEmployee: (id: string, input: EmployeeInput) => Promise<ActionResult>;
  setEmployeeActive: (id: string, isActive: boolean) => Promise<ActionResult>;
  createAssignment: (
    input: AssignmentInput,
  ) => Promise<ActionResult<{ id: string }>>;
  topUpAssignment: (
    assignmentId: string,
    input: TopUpInput,
  ) => Promise<ActionResult>;
  recordCompletion: (
    assignmentId: string,
    input: CompletionInput,
  ) => Promise<ActionResult>;
  reverseCompletion: (
    assignmentId: string,
    input: ReversalInput,
  ) => Promise<ActionResult>;
  generateReceipt: (employeeId: string) => Promise<ActionResult<Receipt>>;
  createArticleType: (input: ArticleInput) => Promise<ActionResult<ArticleType>>;
  updateArticleType: (id: string, input: ArticleInput) => Promise<ActionResult>;
  setArticleTypeActive: (id: string, isActive: boolean) => Promise<ActionResult>;
};

const InventoryContext = React.createContext<InventoryContextValue | null>(null);

/**
 * Holds the snapshot the server rendered with and forwards every mutation to a
 * server action. The actions revalidate on the server, so Next streams a fresh
 * snapshot back into this provider without any client-side cache to keep in
 * sync.
 */
export function InventoryProvider({
  snapshot,
  userRole,
  children,
}: {
  snapshot: InventorySnapshot;
  userRole: AppRole;
  children: React.ReactNode;
}) {
  const value = React.useMemo<InventoryContextValue>(
    () => ({
      userRole,
      isSuperAdmin: userRole === "super_admin",
      state: {
        employees: snapshot.employees,
        articleTypes: snapshot.articleTypes,
        completionEntries: snapshot.completionEntries,
        adjustments: snapshot.adjustments,
        receipts: snapshot.receipts,
      },
      assignmentViews: snapshot.assignments,
      employeeGroups: groupByEmployee(snapshot.assignments),
      createEmployee: createEmployeeAction,
      updateEmployee: updateEmployeeAction,
      setEmployeeActive: setEmployeeActiveAction,
      createAssignment: createAssignmentAction,
      topUpAssignment: topUpAssignmentAction,
      recordCompletion: recordCompletionAction,
      reverseCompletion: reverseCompletionAction,
      generateReceipt: generateReceiptAction,
      createArticleType: createArticleTypeAction,
      updateArticleType: updateArticleTypeAction,
      setArticleTypeActive: setArticleTypeActiveAction,
    }),
    [snapshot, userRole],
  );

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = React.useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used inside an InventoryProvider");
  }
  return context;
}
