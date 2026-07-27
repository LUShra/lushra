"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { orchestrateResponse } from "@/lib/ai/orchestrator";
import { logError } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";

export type SessionActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: {
    content?: string;
  };
  /** Non-fatal: the user's own message still sent successfully. */
  aiWarning?: string;
};

/**
 * Every action re-establishes the current user server-side rather than
 * trusting a value threaded in from the page -- matches
 * features/projects/project-actions.ts's requireUser(), duplicated here
 * rather than shared since neither file imports from the other.
 */
async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return { supabase, user };
}

export async function createSessionAction(
  _prevState: SessionActionState,
  formData: FormData
): Promise<SessionActionState> {
  const projectId = String(formData.get("projectId") ?? "");
  const workspaceId = String(formData.get("workspaceId") ?? "");

  if (!projectId || !workspaceId) {
    return { status: "error", message: "That project could not be found." };
  }

  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      project_id: projectId,
      workspace_id: workspaceId,
      owner_id: user.id
    })
    .select()
    .single();

  if (error || !data) {
    return { status: "error", message: "That session could not be started." };
  }

  redirect(`/workspace/projects/${projectId}/sessions/${data.id}`);
}

export async function sendMessageAction(
  _prevState: SessionActionState,
  formData: FormData
): Promise<SessionActionState> {
  const sessionId = String(formData.get("sessionId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const content = String(formData.get("content") ?? "").trim();

  if (!sessionId || !projectId || !workspaceId) {
    return { status: "error", message: "That session could not be found." };
  }

  if (!content) {
    return { status: "error", fieldErrors: { content: "Enter a message." } };
  }

  if (content.length > 10000) {
    return {
      status: "error",
      fieldErrors: { content: "Message must be 10,000 characters or fewer." }
    };
  }

  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("messages").insert({
    session_id: sessionId,
    workspace_id: workspaceId,
    sender_id: user.id,
    role: "user",
    content
  });

  if (error) {
    return { status: "error", message: "That message could not be sent." };
  }

  const aiWarning = await respondAsAssistant(supabase, sessionId, content);

  revalidatePath(`/workspace/projects/${projectId}/sessions/${sessionId}`);

  return { status: "idle", aiWarning };
}

/**
 * Best-effort: the user's own message already sent successfully above
 * regardless of what happens here. Any failure -- provider error, missing
 * key, or the insert_assistant_message RPC itself failing -- is reported
 * as a non-fatal warning, never surfaced as raw provider or Postgres text.
 */
async function respondAsAssistant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: string,
  instruction: string
): Promise<string | undefined> {
  const result = await orchestrateResponse(instruction);

  if (result.status === "error") {
    logError("orchestrate_response_failed", { sessionId, message: result.message });
    return "The AI assistant couldn't respond. Try again.";
  }

  const { error } = await supabase.rpc("insert_assistant_message", {
    target_session_id: sessionId,
    message_content: result.content
  });

  if (error) {
    logError("insert_assistant_message_failed", { sessionId, message: error.message });
    return "The AI assistant couldn't respond. Try again.";
  }

  return undefined;
}
