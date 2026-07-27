export type LogLevel = "info" | "warn" | "error";

export type LogContext = Record<string, string | number | boolean | null | undefined>;

const consoleByLevel: Record<LogLevel, (line: string) => void> = {
  info: (line) => console.info(line),
  warn: (line) => console.warn(line),
  error: (line) => console.error(line)
};

/**
 * Engineering Standards §18: logs are structured and machine-parseable,
 * correlated to the entity/session/request that produced them, and never
 * carry credentials, full user-authored content, or a complete provider
 * payload -- callers pass only IDs, event names, and short driver/provider
 * messages. One JSON line per call keeps every log directly searchable in
 * Vercel's log viewer without any external monitoring service.
 *
 * `context` is spread before the fixed fields so a context key can never
 * silently override `level`/`event`/`timestamp` (Release Candidate 1
 * fixed a bug where this was the other way around).
 */
export function logEvent(level: LogLevel, event: string, context?: LogContext): void {
  const line = JSON.stringify({
    ...context,
    level,
    event,
    timestamp: new Date().toISOString(),
    // Vercel sets VERCEL_ENV to "production"/"preview"/"development" --
    // distinct from NODE_ENV, which is "production" for both a real
    // production deploy and every preview build. Falls back to NODE_ENV
    // for the one context Vercel doesn't set it: `pnpm dev` locally.
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown"
  });

  consoleByLevel[level](line);
}

/** Thin, pre-existing convenience wrapper -- unchanged shape/behavior for its 40+ existing call sites. */
export function logError(event: string, context?: LogContext): void {
  logEvent("error", event, context);
}
