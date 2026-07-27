import type { Tables } from "@lushra/database";

import { createClient } from "@/lib/supabase/server";

export type PendingReviewArtifact = Tables<"artifacts"> & { projectName: string };

export type PendingReviewsResult =
  | { status: "ready"; artifacts: PendingReviewArtifact[] }
  | { status: "error" };

/**
 * Artifacts in review across every project in the workspace -- a
 * workspace-wide "next actions" surface (Experience Architecture §15),
 * not scoped to any single project. Fetches artifacts and their owning
 * projects' names as two plain queries rather than a PostgREST embedded
 * select, to keep the result type simple and unambiguous.
 */
export async function listPendingReviewArtifacts(
  workspaceId: string
): Promise<PendingReviewsResult> {
  const supabase = await createClient();

  const { data: artifacts, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("status", "in_review")
    .order("updated_at", { ascending: false });

  if (error || !artifacts) {
    if (error) {
      console.error("listPendingReviewArtifacts failed:", error.message);
    }

    return { status: "error" };
  }

  if (artifacts.length === 0) {
    return { status: "ready", artifacts: [] };
  }

  const projectIds = Array.from(new Set(artifacts.map((artifact) => artifact.project_id)));

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name")
    .in("id", projectIds);

  if (projectsError || !projects) {
    if (projectsError) {
      console.error("listPendingReviewArtifacts (projects) failed:", projectsError.message);
    }

    return { status: "error" };
  }

  const projectNameById = new Map(projects.map((project) => [project.id, project.name]));

  return {
    status: "ready",
    artifacts: artifacts.map((artifact) => ({
      ...artifact,
      projectName: projectNameById.get(artifact.project_id) ?? "Unknown project"
    }))
  };
}
