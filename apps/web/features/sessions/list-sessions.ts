import type { Tables } from "@lushra/database";

import { logError } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";

export type Session = Tables<"sessions">;

export type SessionListResult =
  | { status: "ready"; sessions: Session[] }
  | { status: "error" };

export async function listSessions(
  projectId: string,
  workspaceId: string
): Promise<SessionListResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    if (error) {
      logError("list_sessions_failed", { projectId, workspaceId, message: error.message });
    }

    return { status: "error" };
  }

  return { status: "ready", sessions: data };
}

export type SessionResult = { status: "ready"; session: Session } | { status: "error" };

/**
 * Scoped by id, project_id, and workspace_id together -- matches
 * getProject()'s same defense-in-depth pattern (see
 * features/projects/list-projects.ts): RLS already prevents a
 * cross-workspace read, but the explicit filters keep the query's intent
 * legible and catch a session reached via a mismatched project id in the
 * URL, even though it belongs to the same workspace.
 */
export async function getSession(
  sessionId: string,
  projectId: string,
  workspaceId: string
): Promise<SessionResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !data) {
    if (error) {
      logError("get_session_failed", { sessionId, projectId, workspaceId, message: error.message });
    }

    return { status: "error" };
  }

  return { status: "ready", session: data };
}
