import type { Tables } from "@lushra/database";

import { createClient } from "@/lib/supabase/server";

export type Artifact = Tables<"artifacts">;

export type ArtifactListResult =
  | { status: "ready"; artifacts: Artifact[] }
  | { status: "error" };

export async function listArtifacts(
  projectId: string,
  workspaceId: string
): Promise<ArtifactListResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    if (error) {
      console.error("listArtifacts failed:", error.message);
    }

    return { status: "error" };
  }

  return { status: "ready", artifacts: data };
}

export type ArtifactResult = { status: "ready"; artifact: Artifact } | { status: "error" };

/**
 * Scoped by id, project_id, and workspace_id together -- matches
 * getProject()/getSession()'s same defense-in-depth pattern: RLS already
 * prevents a cross-workspace read, but the explicit filters keep the
 * query's intent legible and catch an artifact reached via a mismatched
 * project id in the URL, even though it belongs to the same workspace.
 */
export async function getArtifact(
  artifactId: string,
  projectId: string,
  workspaceId: string
): Promise<ArtifactResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("id", artifactId)
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !data) {
    if (error) {
      console.error("getArtifact failed:", error.message);
    }

    return { status: "error" };
  }

  return { status: "ready", artifact: data };
}
