import type { Tables } from "@lushra/database";

import { createClient } from "@/lib/supabase/server";

export type RecentSession = Tables<"sessions"> & { projectName: string };

export type RecentSessionsResult =
  | { status: "ready"; sessions: RecentSession[] }
  | { status: "error" };

const RECENT_SESSIONS_LIMIT = 5;

/**
 * The most recently started sessions across every project in the
 * workspace -- surfaces "resume a session" as a next action (Experience
 * Architecture §14/§15), not scoped to any single project. Fetches
 * sessions and their owning projects' names as two plain queries rather
 * than a PostgREST embedded select, to keep the result type simple and
 * unambiguous.
 */
export async function listRecentSessions(workspaceId: string): Promise<RecentSessionsResult> {
  const supabase = await createClient();

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(RECENT_SESSIONS_LIMIT);

  if (error || !sessions) {
    if (error) {
      console.error("listRecentSessions failed:", error.message);
    }

    return { status: "error" };
  }

  if (sessions.length === 0) {
    return { status: "ready", sessions: [] };
  }

  const projectIds = Array.from(new Set(sessions.map((session) => session.project_id)));

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name")
    .in("id", projectIds);

  if (projectsError || !projects) {
    if (projectsError) {
      console.error("listRecentSessions (projects) failed:", projectsError.message);
    }

    return { status: "error" };
  }

  const projectNameById = new Map(projects.map((project) => [project.id, project.name]));

  return {
    status: "ready",
    sessions: sessions.map((session) => ({
      ...session,
      projectName: projectNameById.get(session.project_id) ?? "Unknown project"
    }))
  };
}
