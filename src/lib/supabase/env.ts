/**
 * Read on the server only: Server Components, Server Actions, and the proxy.
 * Nothing in the browser talks to Supabase directly, so the unprefixed names
 * are preferred and keep the credentials out of the client bundle. The
 * NEXT_PUBLIC_ spellings still work so existing setups don't break.
 *
 * Supabase also renamed the anon key to the "publishable key", so both of
 * those names are accepted too.
 */
function readUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function readKey() {
  return (
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isSupabaseConfigured() {
  return Boolean(readUrl() && readKey());
}

export function getSupabaseEnv() {
  const url = readUrl();
  const anonKey = readKey();

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and fill in SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return { url, anonKey };
}

export function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function isServiceRoleConfigured() {
  return Boolean(getServiceRoleKey());
}
