// Status rules for external links, shared by scripts/check-links.ts and tests/link-rules.test.ts.

// Hosts that answer automated requests from CI IP ranges with 403 even when the page exists.
// For these, 403 is reported as a warning instead of a failure; other errors still fail.
export const BOT_BLOCKING_HOSTS = new Set([
  "x.com",
  "instagram.com",
  "www.instagram.com",
  "threads.net",
  "www.threads.net",
  "youtube.com",
  "www.youtube.com",
]);

// Instagram also rate-limits automated requests with 429 (Too Many Requests) while the page exists.
// On these hosts 429 is a warning, like 403. On every other host 429 is still an error.
export const RATE_LIMITING_HOSTS = new Set(["instagram.com", "www.instagram.com"]);

/** "ok": link works. "warn": host blocks or rate-limits bots, not a broken link. "error": broken. */
export function classifyExternalStatus(href: string, status: number): "ok" | "warn" | "error" {
  const host = new URL(href).hostname;
  if (status === 403 && BOT_BLOCKING_HOSTS.has(host)) return "warn";
  if (status === 429 && RATE_LIMITING_HOSTS.has(host)) return "warn";
  if (status === 0 || status >= 400) return "error";
  return "ok";
}
