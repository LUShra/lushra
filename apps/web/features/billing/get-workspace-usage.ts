import { logError } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";

export type WorkspaceUsage = {
  projectCount: number;
  sessionCount: number;
  artifactCount: number;
  sourceCount: number;
};

export type WorkspaceUsageResult = { status: "ready"; usage: WorkspaceUsage } | { status: "error" };

/**
 * Product Definition §20 item 13: "basic usage information," deliberately
 * simple totals rather than a Usage Record entity (Platform Architecture
 * §20/§21) -- there is no consumption-metering or quota-enforcement layer
 * yet for a Usage Record to feed, so a persisted per-event ledger would
 * have nothing genuine to record beyond what a live count already shows.
 * Counts every row regardless of status (e.g. archived projects still
 * count) -- "how much you've created," the simplest honest reading of
 * "usage" available without a narrower definition being specified.
 */
export async function getWorkspaceUsage(workspaceId: string): Promise<WorkspaceUsageResult> {
  const supabase = await createClient();

  const [projects, sessions, artifacts, sources] = await Promise.all([
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
    supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
    supabase
      .from("artifacts")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
    supabase
      .from("sources")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
  ]);

  const error = projects.error ?? sessions.error ?? artifacts.error ?? sources.error;

  if (error) {
    logError("get_workspace_usage_failed", { workspaceId, message: error.message });
    return { status: "error" };
  }

  return {
    status: "ready",
    usage: {
      projectCount: projects.count ?? 0,
      sessionCount: sessions.count ?? 0,
      artifactCount: artifacts.count ?? 0,
      sourceCount: sources.count ?? 0
    }
  };
}
