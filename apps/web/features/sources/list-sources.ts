import type { Tables } from "@lushra/database";

import { logError } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";

export type Source = Tables<"sources">;

export type SourceListResult = { status: "ready"; sources: Source[] } | { status: "error" };

export async function listSources(
  projectId: string,
  workspaceId: string
): Promise<SourceListResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    if (error) {
      logError("list_sources_failed", { projectId, workspaceId, message: error.message });
    }

    return { status: "error" };
  }

  return { status: "ready", sources: data };
}
