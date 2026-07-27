import { logEvent } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";

export { buildRateLimitKey, hashIdentifier } from "./rate-limit-key";

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

/** Shared user-facing phrasing for every rate-limited action (auth, AI generation, ...). */
export function describeRetryAfter(retryAfterSeconds: number): string {
  if (retryAfterSeconds < 60) {
    return "in a few seconds";
  }

  const minutes = Math.ceil(retryAfterSeconds / 60);
  return `in ${minutes} minute${minutes === 1 ? "" : "s"}`;
}

/**
 * Server-authoritative: backed by check_rate_limit() (public.rate_limit_hits),
 * shared across every serverless instance via this app's existing
 * Postgres database -- never an in-memory/process-local counter, which
 * would not work correctly on Vercel's serverless model.
 */
export async function checkRateLimit(
  bucketKey: string,
  maxHits: number,
  windowSeconds: number,
  correlationId?: string
): Promise<RateLimitResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_bucket_key: bucketKey,
    p_max_hits: maxHits,
    p_window_seconds: windowSeconds
  });

  if (error || !data || data.length === 0) {
    // Fail OPEN: a broken rate-limit check must never itself become an
    // availability outage for sign-in/sign-up/AI generation. The failure
    // is still logged at "error" so a degraded limiter is visible to the
    // team rather than silently invisible.
    logEvent("error", "rate_limit_check_failed", {
      bucketKey,
      correlationId,
      message: error?.message
    });
    return { allowed: true };
  }

  const [row] = data;

  if (!row.allowed) {
    logEvent("warn", "rate_limit_exceeded", {
      bucketKey,
      correlationId,
      retryAfterSeconds: row.retry_after_seconds
    });
    return { allowed: false, retryAfterSeconds: row.retry_after_seconds };
  }

  return { allowed: true };
}
