export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

/** Turns a Postgres error into something an admin can act on. */
export function describeDbError(error: {
  code?: string;
  message: string;
}): string {
  if (error.code === "23505") {
    return "That record already exists";
  }

  if (error.message.includes("NO_PENDING_PIECES")) {
    return "No completed pieces are waiting to be receipted";
  }

  if (error.message.includes("EMPLOYEE_NOT_FOUND")) {
    return "That employee no longer exists";
  }

  if (error.message.includes("ASSIGNMENT_NOT_FOUND")) {
    return "That assignment no longer exists";
  }

  if (error.message.includes("cannot exceed the assigned quantity")) {
    return "That would put more pieces back than were handed out";
  }

  if (error.message.includes("cannot fall below zero")) {
    return "That reversal is larger than what has been completed";
  }

  return error.message;
}
