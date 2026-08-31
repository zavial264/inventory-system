"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
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
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      navLayout="around"
      {...props}
      locale={enGB}
      weekStartsOn={1}
      animate={false}
      className={cn("w-fit min-w-[17.5rem] select-none", className)}
      classNames={{
        root: cn("relative", defaultClassNames.root),
        months: cn("relative flex flex-col", defaultClassNames.months),
        month: cn(
          "relative flex w-full flex-col gap-3 overflow-hidden",
          defaultClassNames.month,
        ),
        month_caption: cn(
          "flex h-9 w-full items-center justify-center px-9",
          defaultClassNames.month_caption,
        ),
        caption_label: cn(
          "max-w-full truncate px-1 text-sm font-semibold tracking-tight text-foreground",
          defaultClassNames.caption_label,
        ),
        dropdowns: cn(
          "flex items-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "relative rounded-md border border-input bg-card shadow-sm has-focus:border-ring has-focus:ring-[3px] has-focus:ring-ring/30",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          "absolute inset-0 cursor-pointer opacity-0",
          defaultClassNames.dropdown,
        ),
        nav: cn(
          "absolute inset-x-0 top-0 z-10 flex h-9 items-center justify-between",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "absolute top-0 left-0 z-10 size-8 text-muted-foreground hover:bg-accent hover:text-foreground",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "absolute top-0 right-0 z-10 size-8 text-muted-foreground hover:bg-accent hover:text-foreground",
          defaultClassNames.button_next,
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex w-full", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 pb-1 text-center text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted-foreground",
          defaultClassNames.weekday,
        ),
        weeks: cn("relative flex flex-col overflow-hidden", defaultClassNames.weeks),
        week: cn("mt-0.5 flex w-full", defaultClassNames.week),
        week_number_header: cn("w-9", defaultClassNames.week_number_header),
        week_number: cn(
          "w-9 text-[0.7rem] tabular text-muted-foreground",
          defaultClassNames.week_number,
        ),
        day: cn(
          "group/day relative aspect-square flex-1 p-0 text-center",
          defaultClassNames.day,
        ),
        day_button: cn(
          "size-full rounded-md text-sm tabular outline-none transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:ring-[3px] focus-visible:ring-ring/30",
          "group-data-[selected=true]/day:bg-primary group-data-[selected=true]/day:text-primary-foreground group-data-[selected=true]/day:hover:bg-primary/90 group-data-[selected=true]/day:hover:text-primary-foreground",
          "group-data-[disabled=true]/day:pointer-events-none group-data-[disabled=true]/day:text-muted-foreground/40",
          "group-data-[outside=true]/day:text-muted-foreground/45",
        ),
        today: cn(
          "[&:not([data-selected=true])>button]:bg-accent [&:not([data-selected=true])>button]:font-medium [&:not([data-selected=true])>button]:text-accent-foreground",
          defaultClassNames.today,
        ),
        outside: cn("text-muted-foreground/45", defaultClassNames.outside),
        disabled: cn("text-muted-foreground/40", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        range_start: cn("rounded-l-md bg-accent", defaultClassNames.range_start),
        range_middle: cn(
          "bg-accent [&>button]:rounded-none [&>button]:bg-transparent [&>button]:text-accent-foreground",
          defaultClassNames.range_middle,
        ),
        range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
        footer: cn("pt-2 text-xs text-muted-foreground", defaultClassNames.footer),
        ...classNames,
      }}
      formatters={{
        formatCaption: (date) =>
          date.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
        formatWeekdayName: (date) =>
          date.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 2),
        ...props.formatters,
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
        ...props.components,
      }}
    />
  );
}

export { Calendar };
