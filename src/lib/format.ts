const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-PK");

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Reads a `yyyy-mm-dd` string as a local calendar date. */
export function parseLocalDate(value: string) {
  if (ISO_DATE.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? parseLocalDate(value) : value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Inclusive date-range check for `yyyy-mm-dd` strings. */
export function isDateWithinRange(date: string, start: string, end: string) {
  return date >= start && date <= end;
}

export function toDateInputValue(date: Date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function addDaysIso(isoDate: string, days: number) {
  const date = parseLocalDate(isoDate);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

/** Monday of the week containing `date`, as `yyyy-mm-dd`. */
export function startOfWeekMonday(date: Date = new Date()) {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = local.getDay();
  const offset = day === 0 ? 6 : day - 1;
  local.setDate(local.getDate() - offset);
  return toDateInputValue(local);
}

export function weekEndFromStart(weekStart: string) {
  return addDaysIso(weekStart, 6);
}

export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
