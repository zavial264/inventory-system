import { cn } from "@/lib/utils";

export function ProgressBar({
  completed,
  total,
  className,
}: {
  completed: number;
  total: number;
  className?: string;
}) {
  const percent =
    total <= 0 ? 0 : Math.min(100, Math.max(0, (completed / total) * 100));
  const done = percent >= 100;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${completed} of ${total} pieces completed`}
      className={cn("h-1.5 w-full rounded-full bg-muted", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all",
          done ? "bg-success" : "bg-warning",
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
