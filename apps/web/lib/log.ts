type LogContext = Record<string, string | number | boolean | null | undefined>;

/**
 * Engineering Standards §18: logs are structured and machine-parseable,
 * correlated to the entity/session/request that produced them, and never
 * carry credentials, full user-authored content, or a complete provider
 * payload -- callers pass only IDs, event names, and short driver/provider
 * messages. One JSON line per call keeps every log directly searchable in
 * Vercel's log viewer without any external monitoring service.
 */
export function logError(event: string, context?: LogContext): void {
  console.error(
    JSON.stringify({
      level: "error",
      event,
      timestamp: new Date().toISOString(),
      ...context
    })
  );
}
