import { logError } from "@/lib/log";

import type { AiProvider, AiProviderResult } from "../provider";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o-mini";
const REQUEST_TIMEOUT_MS = 30_000;
/** Keeps a reply comfortably under messages.content's 10,000-character CHECK. */
const MAX_OUTPUT_TOKENS = 1000;

type OpenAiChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

/**
 * Reads OPENAI_API_KEY server-side only. Never imported from a "use
 * client" module -- its only caller is session-actions.ts ("use server"),
 * so no bundler ever ships this file (or the key it reads) to the browser.
 */
export const openAiProvider: AiProvider = {
  async respond(instruction: string): Promise<AiProviderResult> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return { status: "error", message: "The AI provider is not configured." };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          max_tokens: MAX_OUTPUT_TOKENS,
          messages: [{ role: "user", content: instruction }]
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        logError("openai_provider_request_failed", { status: response.status });
        return { status: "error", message: "The AI provider request failed." };
      }

      const data = (await response.json()) as OpenAiChatCompletionResponse;
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        logError("openai_provider_empty_response");
        return { status: "error", message: "The AI provider returned an empty response." };
      }

      return { status: "ok", content };
    } catch (error) {
      logError("openai_provider_request_threw", {
        message: error instanceof Error ? error.message : "unknown error"
      });
      return { status: "error", message: "The AI provider request failed." };
    } finally {
      clearTimeout(timeout);
    }
  }
};
