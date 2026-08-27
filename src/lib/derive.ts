import type { AssignmentView, EmployeeGroup } from "@/lib/types";

/**
 * Per-assignment balances come from the `assignment_progress` view in Postgres.
 * This only rolls those figures up per employee for the tracking page.
 */
export function groupByEmployee(views: AssignmentView[]): EmployeeGroup[] {
  const groups = new Map<string, EmployeeGroup>();

  for (const view of views) {
    let group = groups.get(view.employeeId);
    if (!group) {
      group = {
        employee: view.employee,
        assignments: [],
        totalAssigned: 0,
        totalCompleted: 0,
        totalRemaining: 0,
        unreceiptedPieces: 0,
      };
      groups.set(view.employeeId, group);
    }

    group.assignments.push(view);
    group.totalAssigned += view.quantityAssigned;
    group.totalCompleted += view.completedQuantity;
    group.totalRemaining += view.remainingQuantity;
    group.unreceiptedPieces += Math.max(view.unreceiptedQuantity, 0);
  }

  for (const group of groups.values()) {
    group.assignments.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  return [...groups.values()].sort((a, b) => {
    const aLatest = a.assignments[0]?.updatedAt ?? "";
    const bLatest = b.assignments[0]?.updatedAt ?? "";
    return bLatest.localeCompare(aLatest);
  });
}
