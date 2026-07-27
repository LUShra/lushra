import { logError } from "@/lib/log";

/**
 * Next.js's global unhandled-error hook (App Router, stable since 15) --
 * catches exceptions no route/action/middleware code path already
 * handles, which every other `logError` call site in this app is a
 * deliberate try/catch or `{ error }`-checked branch around, not this.
 * Loosely typed and defensively read rather than matching Next's exact
 * exported types verbatim: this environment cannot link `next`'s type
 * declarations to check that shape locally, so CI's typecheck is the
 * real verification gate here, same as every other Next-typed file
 * touched this pass.
 */
export async function onRequestError(
  error: unknown,
  request: { path?: string; method?: string } | undefined,
  context: { routePath?: string; routeType?: string } | undefined
): Promise<void> {
  logError("unhandled_request_error", {
    route: request?.path ?? context?.routePath,
    method: request?.method,
    routeType: context?.routeType,
    errorCode: error instanceof Error ? error.name : undefined,
    message: error instanceof Error ? error.message : "unknown error"
  });
}
