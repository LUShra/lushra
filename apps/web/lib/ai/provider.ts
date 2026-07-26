/**
 * Platform Architecture §12 (Model Provider Abstraction Layer): every
 * provider implements this shape and nothing above the orchestrator
 * (apps/web/lib/ai/orchestrator.ts) ever depends on a specific provider's
 * API shape. Server-only -- never imported from a "use client" module.
 */
export type AiProviderResult = { status: "ok"; content: string } | { status: "error"; message: string };

export type AiProvider = {
  respond(instruction: string): Promise<AiProviderResult>;
};
