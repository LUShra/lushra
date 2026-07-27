import type { Tables } from "@lushra/database";

import { logError } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";

export type ArtifactVersion = Tables<"artifact_versions">;

export type ArtifactVersionListResult =
  | { status: "ready"; versions: ArtifactVersion[] }
  | { status: "error" };

/** Most recent first -- a history list, not a chronological read. */
export async function listArtifactVersions(
  artifactId: string,
  workspaceId: string
): Promise<ArtifactVersionListResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("artifact_versions")
    .select("*")
    .eq("artifact_id", artifactId)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    if (error) {
      logError("list_artifact_versions_failed", {
        artifactId,
        workspaceId,
        message: error.message
      });
    }

    return { status: "error" };
  }

  return { status: "ready", versions: data };
}
