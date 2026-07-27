import type { Tables } from "@lushra/database";

import { logError } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";

export type Project = Tables<"projects">;

export type ProjectListResult =
  | { status: "ready"; projects: Project[] }
  | { status: "error" };

/**
 * Not wrapped in React's cache() like getOrCreatePersonalWorkspace(): the
 * Overview and Projects pages are separate routes, so only one of them
 * ever calls this within a given request -- there is no duplicate-call
 * dedup benefit here, so we keep this plain rather than adding the
 * wrapper for its own sake.
 */
export async function listProjects(workspaceId: string): Promise<ProjectListResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    if (error) {
      logError("list_projects_failed", { workspaceId, message: error.message });
    }

    return { status: "error" };
  }

  return { status: "ready", projects: data };
}

export type ProjectResult = { status: "ready"; project: Project } | { status: "error" };

/**
 * Scoped by both id and workspace_id, not id alone -- RLS already
 * prevents a cross-workspace read, but the explicit filter keeps the
 * query's intent legible on its own and matches listProjects()'s same
 * pattern rather than relying solely on RLS to narrow scope by omission.
 */
export async function getProject(projectId: string, workspaceId: string): Promise<ProjectResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !data) {
    if (error) {
      logError("get_project_failed", { projectId, workspaceId, message: error.message });
    }

    return { status: "error" };
  }

  return { status: "ready", project: data };
}
