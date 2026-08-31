"use server";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { requireSuperAdmin } from "@/lib/auth/roles";
import { toLedgerEntry } from "@/lib/data/mappers";
import { LEDGER_MAX_DAYS, isLedgerRangeValid } from "@/lib/ledger";
import {
  ensureFreshSession,
  isClockSkewError,
  withClockSkewRetry,
} from "@/lib/supabase/clock-skew";
import { createClient } from "@/lib/supabase/server";
import type { EmployeeLedger } from "@/lib/types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function getEmployeeLedgerAction(
  employeeId: string,
  from: string,
  to: string,
): Promise<ActionResult<EmployeeLedger>> {
  const gate = await requireSuperAdmin(
    "Only a Super Admin can view the employee ledger",
  );
  if (!gate.ok) return fail(gate.error);

  if (!employeeId) return fail("Choose an employee to view their ledger");
  if (!ISO_DATE.test(from) || !ISO_DATE.test(to)) {
    return fail("Choose a start and end date");
  }
  if (from > to) {
    return fail("Start date must be on or before the end date");
  }
  if (!isLedgerRangeValid(from, to)) {
    return fail(`Ledger can show at most ${LEDGER_MAX_DAYS} days at a time`);
  }

  try {
    const supabase = await createClient();

    const fetchPeriod = async () => {
      await ensureFreshSession(supabase);
      return Promise.all([
        supabase
          .from("employees")
          .select("id, name")
          .eq("id", employeeId)
          .maybeSingle(),
        supabase
          .from("employee_ledger")
          .select("*")
          .eq("employee_id", employeeId)
          .gte("occurred_on", from)
          .lte("occurred_on", to)
          .order("occurred_on", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);
    };

    const [employee, ledger] = await withClockSkewRetry(fetchPeriod, (result) =>
      result.some(
        (part) => part.error && isClockSkewError(part.error.message),
      ),
    );

    if (employee.error) {
      return fail(`Could not load employee: ${employee.error.message}`);
    }
    if (ledger.error) {
      return fail(`Could not load ledger: ${ledger.error.message}`);
    }
    if (!employee.data) return fail("That employee no longer exists");

    const entries = (ledger.data ?? []).map(toLedgerEntry);

    return ok({
      employeeId: employee.data.id,
      employeeName: employee.data.name,
      from,
      to,
      entries,
      totalPieces: entries.reduce((sum, entry) => sum + entry.quantity, 0),
      totalAmount: entries.reduce((sum, entry) => sum + entry.amount, 0),
    });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Could not load the ledger",
    );
  }
}
