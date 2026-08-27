import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type AssignmentStatus, type AssignmentView } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusVariant: Record<
  AssignmentStatus,
  "outline" | "warning" | "success"
> = {
  not_started: "outline",
  in_progress: "warning",
  completed: "success",
};

export function StatusBadge({
  status,
  className,
}: {
  status: AssignmentStatus;
  className?: string;
}) {
  return (
    <Badge variant={statusVariant[status]} className={className}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function AssignmentSummary({
  assignment,
  className,
}: {
  assignment: AssignmentView;
  className?: string;
}) {
  const cells = [
    { label: "Assigned", value: assignment.quantityAssigned },
    { label: "Completed", value: assignment.completedQuantity },
    { label: "Remaining", value: assignment.remainingQuantity },
  ];

  return (
    <div className={cn("rounded-lg border border-border bg-muted/40", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {assignment.employee.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {assignment.articleType.name} · Size {assignment.size}
          </p>
        </div>
        <StatusBadge status={assignment.status} />
      </div>
      <dl className="grid grid-cols-3 divide-x divide-border">
        {cells.map((cell) => (
          <div key={cell.label} className="px-4 py-3 text-center">
            <dt className="text-xs text-muted-foreground">{cell.label}</dt>
            <dd className="tabular text-lg font-semibold">{cell.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
