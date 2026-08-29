import "server-only";

/** Postgres rejects JWTs whose `iat` is still in the future — common after sign-in. */
const CLOCK_SKEW = /issued at future/i;

const RETRY_DELAYS_MS = [500, 1_000, 2_000, 4_000, 8_000];

export function isClockSkewError(message: string) {
  return CLOCK_SKEW.test(message);
}

export function clockSkewHelpText() {
  return "Your device clock looks out of sync with the server. Check your date and time settings, then refresh the page.";
}

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

/** Validates the session with Supabase Auth before RLS-backed queries. */
export async function ensureFreshSession(supabase: SupabaseClient) {
  await supabase.auth.getUser();
}

export async function withClockSkewRetry<T>(
  run: () => Promise<T>,
  shouldRetry: (result: T) => boolean,
): Promise<T> {
  let result = await run();

  for (const delay of RETRY_DELAYS_MS) {
    if (!shouldRetry(result)) return result;
    await sleep(delay);
    result = await run();
  }

  return result;
}

export function failQuery(label: string, message: string): never {
  if (isClockSkewError(message)) {
    throw new Error(`Could not load ${label}: ${clockSkewHelpText()}`);
  }
  throw new Error(`Could not load ${label}: ${message}`);
}
