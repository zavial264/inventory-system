"use server";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { requireSuperAdmin } from "@/lib/auth/roles";
import { toLedgerEntry } from "@/lib/data/mappers";
import {
  parseLocalDate,
  startOfWeekMonday,
  weekEndFromStart,
} from "@/lib/format";
import {
  ensureFreshSession,
  isClockSkewError,
  withClockSkewRetry,
} from "@/lib/supabase/clock-skew";
import { createClient } from "@/lib/supabase/server";
import type { EmployeeWeekLedger } from "@/lib/types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function getEmployeeWeekLedgerAction(
  employeeId: string,
  weekStart?: string,
): Promise<ActionResult<EmployeeWeekLedger>> {
  const gate = await requireSuperAdmin(
    "Only a Super Admin can view the employee ledger",
  );
  if (!gate.ok) return fail(gate.error);

  if (!employeeId) return fail("Choose an employee to view their ledger");

  const resolvedStart =
    weekStart && ISO_DATE.test(weekStart)
      ? startOfWeekMonday(parseLocalDate(weekStart))
      : startOfWeekMonday();
  const weekEnd = weekEndFromStart(resolvedStart);

  try {
    const supabase = await createClient();

    const fetchWeek = async () => {
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
          .gte("occurred_on", resolvedStart)
          .lte("occurred_on", weekEnd)
          .order("occurred_on", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);
    };

    const [employee, ledger] = await withClockSkewRetry(fetchWeek, (result) =>
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
      weekStart: resolvedStart,
      weekEnd,
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
