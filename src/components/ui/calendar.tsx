"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { DayPicker } from "react-day-picker";
import { enGB } from "react-day-picker/locale";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      animate
      {...props}
      locale={enGB}
      weekStartsOn={1}
      className={cn("w-fit select-none", className)}
      classNames={{
        root: "relative",
        months: "flex flex-col gap-3",
        month: "flex flex-col gap-3",
        month_caption: "relative flex h-9 items-center justify-center px-9",
        caption_label: "text-sm font-semibold tracking-tight text-foreground",
        dropdowns: "flex items-center gap-1.5 text-sm font-medium",
        dropdown_root:
          "relative rounded-md border border-input bg-card shadow-sm has-focus:border-ring has-focus:ring-[3px] has-focus:ring-ring/30",
        dropdown: "absolute inset-0 cursor-pointer opacity-0",
        nav: "absolute inset-x-0 top-0 flex h-9 items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-8 text-muted-foreground hover:bg-accent hover:text-foreground",
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-8 text-muted-foreground hover:bg-accent hover:text-foreground",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-9 pb-1 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted-foreground",
        weeks: "flex flex-col",
        week: "mt-0.5 flex w-full",
        week_number_header: "w-9",
        week_number: "w-9 text-[0.7rem] tabular text-muted-foreground",
        day: "group/day relative size-9 p-0 text-center",
        day_button: cn(
          "size-9 rounded-md text-sm tabular outline-none transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:ring-[3px] focus-visible:ring-ring/30",
          "group-data-[selected=true]/day:bg-primary group-data-[selected=true]/day:text-primary-foreground group-data-[selected=true]/day:hover:bg-primary/90 group-data-[selected=true]/day:hover:text-primary-foreground",
          "group-data-[disabled=true]/day:pointer-events-none group-data-[disabled=true]/day:text-muted-foreground/40",
          "group-data-[outside=true]/day:text-muted-foreground/45",
        ),
        today:
          "[&:not([data-selected=true])>button]:bg-accent [&:not([data-selected=true])>button]:font-medium [&:not([data-selected=true])>button]:text-accent-foreground",
        outside: "text-muted-foreground/45",
        disabled: "text-muted-foreground/40",
        hidden: "invisible",
        range_start: "rounded-l-md bg-accent",
        range_middle:
          "bg-accent [&>button]:rounded-none [&>button]:bg-transparent [&>button]:text-accent-foreground",
        range_end: "rounded-r-md bg-accent",
        footer: "pt-2 text-xs text-muted-foreground",
        ...classNames,
      }}
      formatters={{
        formatWeekdayName: (date) =>
          date.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 2),
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeftIcon
              : orientation === "right"
                ? ChevronRightIcon
                : ChevronDownIcon;

          return <Icon className={cn("size-4", chevronClassName)} />;
        },
      }}
    />
  );
}

export { Calendar };
