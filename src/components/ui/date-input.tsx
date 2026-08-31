"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import type { Matcher } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate, toDateInputValue } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Reads a `yyyy-mm-dd` string as a local date, avoiding the UTC shift of `new Date(string)`. */
function parseDateValue(value?: string) {
  if (!value) return undefined;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function DateInput({
  id,
  value,
  onValueChange,
  min,
  max,
  placeholder = "Pick a date",
  disabled,
  required,
  align = "start",
  className,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
}: {
  id?: string;
  value?: string;
  onValueChange: (value: string) => void;
  /** Earliest selectable date as `yyyy-mm-dd`. */
  min?: string;
  /** Latest selectable date as `yyyy-mm-dd`. */
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  align?: "start" | "center" | "end";
  className?: string;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const selected = parseDateValue(value);
  const earliest = parseDateValue(min);
  const latest = parseDateValue(max);
  const today = toDateInputValue();
  const todayOutOfRange = Boolean(
    (min && today < min) || (max && today > max),
  );

  const disabledDays: Matcher[] = [];
  if (earliest) disabledDays.push({ before: earliest });
  if (latest) disabledDays.push({ after: latest });

  const commit = (next?: Date) => {
    onValueChange(next ? toDateInputValue(next) : "");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-label={ariaLabel}
          data-slot="date-input"
          className={cn(
            "h-9 w-full justify-start gap-2 border-input px-3 font-normal shadow-sm",
            "hover:bg-card hover:text-foreground",
            "data-[state=open]:border-ring data-[state=open]:ring-[3px] data-[state=open]:ring-ring/30",
            !selected && "text-muted-foreground",
            "aria-invalid:border-destructive aria-invalid:ring-destructive/25",
            className,
          )}
        >
          <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate tabular tracking-tight">
            {selected ? formatDate(selected) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        className="w-auto overflow-hidden rounded-xl p-0 shadow-lg"
      >
        <Calendar
          mode="single"
          required={required}
          selected={selected}
          onSelect={(next: Date | undefined) => {
            if (!next && required) return;
            commit(next);
          }}
          defaultMonth={selected ?? latest ?? undefined}
          disabled={disabledDays}
          autoFocus
          className="p-3"
        />

        <div
          className={cn(
            "flex items-center border-t border-border bg-muted/40 px-2 py-1.5",
            required ? "justify-end" : "justify-between",
          )}
        >
          {required ? null : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => commit(undefined)}
              disabled={!selected}
            >
              Clear
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => commit(new Date())}
            disabled={todayOutOfRange}
          >
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { DateInput };
