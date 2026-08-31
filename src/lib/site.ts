/**
 * Canonical site origin for metadata (Open Graph, Twitter cards, icons).
 * Prefer APP_URL in production; Vercel deployment URLs are the fallback.
 */
export function getSiteUrl() {
  const explicit = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return toAbsoluteUrl(explicit);

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelHost) return toAbsoluteUrl(vercelHost);

  return new URL("http://localhost:3000");
}

function toAbsoluteUrl(value: string) {
  const trimmed = value.trim();
  return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
}
