import type { AiProviderResult } from "./provider";
import { openAiProvider } from "./providers/openai-provider";

/**
 * Platform Architecture §11 (AI Orchestration Layer): the one entry point
 * anything above this layer calls. Today it routes every request to the
 * single wired provider (Product Definition §17's Observed automation
 * level -- this generates a session reply, it does not change any
 * Project/Artifact state); adding a second provider or real routing logic
 * later changes only this function's body, never any caller.
 */
export async function orchestrateResponse(instruction: string): Promise<AiProviderResult> {
  return openAiProvider.respond(instruction);
}
