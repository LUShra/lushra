import type { Tables } from "@lushra/database";

import { logError } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";

export type Message = Tables<"messages">;

export type MessageListResult =
  | { status: "ready"; messages: Message[] }
  | { status: "error" };

/** Ascending order: message history reads chronologically, oldest first. */
export async function listMessages(
  sessionId: string,
  workspaceId: string
): Promise<MessageListResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", sessionId)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    if (error) {
      logError("list_messages_failed", { sessionId, workspaceId, message: error.message });
    }

    return { status: "error" };
  }

  return { status: "ready", messages: data };
}
