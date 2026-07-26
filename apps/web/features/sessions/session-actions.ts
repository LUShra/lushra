"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type SessionActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: {
    content?: string;
  };
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
    content
  });

  if (error) {
    return { status: "error", message: "That message could not be sent." };
  }

  revalidatePath(`/workspace/projects/${projectId}/sessions/${sessionId}`);

  return { status: "idle" };
}
