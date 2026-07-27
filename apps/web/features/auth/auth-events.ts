import type { AuthError } from "@supabase/supabase-js";

// Relative, not the usual `@/lib/log` alias: this is the one module in
// this codebase deliberately kept resolvable by a bare `node --test`
// (no bundler, no tsconfig path mapping) so its security-sensitive
// pieces -- the event taxonomy and error redaction -- have real,
// directly-executed test coverage rather than review alone.
import { logEvent, type LogContext, type LogLevel } from "../../lib/log.ts";

/**
 * The complete authentication event taxonomy (Release Candidate 2).
 * Stable names, never reused for a different meaning -- add a new event
 * rather than repurposing one if behavior changes later.
 */
export const AUTH_EVENTS = {
  signUpSucceeded: "auth_sign_up_succeeded",
  signUpFailed: "auth_sign_up_failed",
  signInSucceeded: "auth_sign_in_succeeded",
  signInFailed: "auth_sign_in_failed",
  signedOut: "auth_signed_out",
  passwordRecoveryRequested: "auth_password_recovery_requested",
  passwordRecoveryFailed: "auth_password_recovery_failed",
  passwordUpdateSucceeded: "auth_password_update_succeeded",
  passwordUpdateFailed: "auth_password_update_failed",
  confirmationSucceeded: "auth_confirmation_succeeded",
  confirmationFailed: "auth_confirmation_failed",
  confirmationInvalidRequest: "auth_confirmation_invalid_request",
  protectedRouteDenied: "auth_protected_route_denied"
} as const;

export type AuthEventName = (typeof AUTH_EVENTS)[keyof typeof AUTH_EVENTS];

/**
 * A restricted, specific field set rather than an open record, so a
 * future call site can't accidentally widen what an auth log line is
 * allowed to carry (e.g. a password or token) the way an unrestricted
 * context parameter would. `correlationId` is provided by the caller
 * (via `@/lib/correlation`'s `getCorrelationId()`) rather than resolved
 * in here, so this module has no dependency on `next/headers` and no
 * Next.js request context is needed to unit-test it.
 */
export type AuthEventContext = {
  correlationId?: string;
  userId?: string;
  email?: string;
  route?: string;
  otpType?: string;
  errorCode?: string;
  message?: string;
};

/**
 * Every auth event goes through this one function so the safe-field
 * allowlist above is applied uniformly. Synchronous and side-effect-free
 * beyond the log write itself -- safe to call from any context.
 */
export function logAuthEvent(
  level: LogLevel,
  event: AuthEventName,
  context: AuthEventContext = {}
): void {
  logEvent(level, event, context as LogContext);
}

/**
 * Supabase Auth's own error messages are already curated for safe
 * display (per Milestone 26/RC1's review, distinct from raw Postgres
 * driver errors) -- but this still only forwards the specific fields a
 * log line needs, rather than the whole error object, so a future
 * Supabase SDK version adding a new field to AuthError can never silently
 * start leaking something new into logs.
 */
export function normalizeAuthError(error: AuthError): { errorCode: string; message: string } {
  return {
    errorCode: error.code ?? String(error.status ?? "unknown"),
    message: error.message
  };
}
