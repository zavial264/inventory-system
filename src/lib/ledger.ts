import { addDaysIso, parseLocalDate, toDateInputValue } from "@/lib/format";

/** Inclusive maximum span Super Admin can query on the employee ledger. */
export const LEDGER_MAX_DAYS = 30;

const MAX_OFFSET = LEDGER_MAX_DAYS - 1;

export function inclusiveDayCount(from: string, to: string) {
  const start = parseLocalDate(from).getTime();
  const end = parseLocalDate(to).getTime();
  return Math.round((end - start) / 86_400_000) + 1;
}

export function isLedgerRangeValid(from: string, to: string) {
  return from <= to && inclusiveDayCount(from, to) <= LEDGER_MAX_DAYS;
}

export function latestLedgerTo(from: string, today = toDateInputValue()) {
  const capped = addDaysIso(from, MAX_OFFSET);
  return capped < today ? capped : today;
}

export function constrainLedgerFrom(nextFrom: string, currentTo: string) {
  let to = currentTo < nextFrom ? nextFrom : currentTo;
  if (inclusiveDayCount(nextFrom, to) > LEDGER_MAX_DAYS) {
    to = addDaysIso(nextFrom, MAX_OFFSET);
  }
  return { from: nextFrom, to };
}

export function constrainLedgerTo(currentFrom: string, nextTo: string) {
  let from = currentFrom > nextTo ? nextTo : currentFrom;
  if (inclusiveDayCount(from, nextTo) > LEDGER_MAX_DAYS) {
    from = addDaysIso(nextTo, -MAX_OFFSET);
  }
  return { from, to: nextTo };
}

export function defaultLedgerRange(today = toDateInputValue()) {
  return {
    from: addDaysIso(today, -6),
    to: today,
  };
}
