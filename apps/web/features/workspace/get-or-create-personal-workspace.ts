import { cache } from "react";

import type { Tables } from "@lushra/database";

import { logError } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";

export type PersonalWorkspace = Tables<"workspaces">;

export type WorkspaceProvisionResult =
  | { status: "ready"; workspace: PersonalWorkspace }
  | { status: "error" };

/**
 * Wrapped in React's cache() so every call within the same request (the
 * workspace layout, the Overview page, any future sibling page) shares
 * one underlying `ensure_personal_workspace` invocation instead of each
 * provisioning independently -- per-request memoization, not a client
 * cache, so a fresh request always re-checks.
 */
export const getOrCreatePersonalWorkspace = cache(
  async (): Promise<WorkspaceProvisionResult> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("ensure_personal_workspace");

    if (error || !data) {
      if (error) {
        logError("ensure_personal_workspace_failed", { message: error.message });
      }

      return { status: "error" };
    }

    return { status: "ready", workspace: data };
  }
);
