import { createHash } from "node:crypto";

/**
 * Hashed rather than stored raw: `rate_limit_hits.bucket_key` (never
 * exposed via PostgREST -- see the migration) still doesn't need to hold
 * a plaintext email or IP when a stable, one-way hash identifies the
 * same bucket just as well. Truncated to 32 hex chars -- a bucket key,
 * not a security credential; collision risk at that length is
 * irrelevant to what this protects against.
 *
 * Kept in its own dependency-free module (only `node:crypto`, a Node
 * builtin) so this pure logic has real, directly-executed test coverage
 * without needing a bundler -- `rate-limit.ts` re-exports it alongside
 * the DB-backed `checkRateLimit()`.
 */
export function hashIdentifier(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 32);
}

export function buildRateLimitKey(
  action: string,
  kind: "email" | "ip" | "user",
  identifier: string
): string {
  return `${action}:${kind}:${hashIdentifier(identifier)}`;
}
