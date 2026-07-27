import type { Tables } from "@lushra/database";

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
      console.error("listSources failed:", error.message);
    }

    return { status: "error" };
  }

  return { status: "ready", sources: data };
}
