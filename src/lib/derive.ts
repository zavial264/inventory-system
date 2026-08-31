import { isDateWithinRange } from "@/lib/format";
import type { AssignmentView, CompletionEntry, EmployeeGroup } from "@/lib/types";

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

/** True when the employee had assignments or completions in the inclusive range. */
export function employeeWorkedInPeriod(
  employeeId: string,
  start: string,
  end: string,
  assignmentViews: AssignmentView[],
  completionEntries: CompletionEntry[],
): boolean {
  const assignmentById = new Map(
    assignmentViews.map((view) => [view.id, view]),
  );

  const hasAssignment = assignmentViews.some(
    (view) =>
      view.employeeId === employeeId &&
      (isDateWithinRange(view.createdAt.slice(0, 10), start, end) ||
        isDateWithinRange(view.updatedAt.slice(0, 10), start, end)),
  );

  const hasCompletion = completionEntries.some((entry) => {
    const assignment = assignmentById.get(entry.assignmentId);
    if (!assignment || assignment.employeeId !== employeeId) return false;
    return isDateWithinRange(entry.completedOn, start, end);
  });

  return hasAssignment || hasCompletion;
}
