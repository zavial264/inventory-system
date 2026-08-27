import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "warning" | "success";
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon
          className={cn(
            "size-3.5",
            tone === "warning" && "text-warning",
            tone === "success" && "text-success",
          )}
        />
        {label}
      </div>
      <p className="tabular mt-1.5 text-2xl font-semibold leading-none">
        {value}
      </p>
    </div>
  );
}
