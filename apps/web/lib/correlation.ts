import { headers } from "next/headers";

/**
 * Vercel stamps every request with this header for its own tracing; using
 * it as a log correlation id costs nothing new to provision and lets a
 * support/incident investigation cross-reference an application log line
 * against Vercel's own request logs. Best-effort: absent outside Vercel
 * (e.g. plain local dev), where a log line simply carries no correlation
 * id rather than a fabricated one.
 *
 * Deliberately the only thing in this file that touches `next/headers` --
 * kept separate from the modules that build log entries so those stay
 * plain, dependency-free, and unit-testable without a Next.js request
 * context (`next/headers` throws if called outside one).
 */
export async function getCorrelationId(): Promise<string | undefined> {
  try {
    const headerList = await headers();
    return headerList.get("x-vercel-id") ?? undefined;
  } catch {
    return undefined;
  }
}
