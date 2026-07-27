"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { logError } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";

export type VersionActionState = {
  status: "idle" | "error";
  message?: string;
};

/**
 * Every action re-establishes the current user server-side rather than
 * trusting a value threaded in from the page -- matches
 * features/projects/project-actions.ts's requireUser(), duplicated here
 * rather than shared since neither file imports from the other.
 */
async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return { supabase, user };
}

/**
 * Snapshots the artifact's current, live content into an immutable
 * artifact_versions row. Content is read from the artifact row itself
 * rather than trusted from the client -- there is no textarea on this
 * button, only a workspace/artifact id, so the snapshot always reflects
 * whatever was last actually saved via updateArtifactContentAction.
 */
export async function saveArtifactVersionAction(
  _prevState: VersionActionState,
  formData: FormData
): Promise<VersionActionState> {
  const artifactId = String(formData.get("artifactId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const workspaceId = String(formData.get("workspaceId") ?? "");

  if (!artifactId || !projectId || !workspaceId) {
    return { status: "error", message: "That artifact could not be found." };
  }

  const { supabase, user } = await requireUser();

  const { data: artifact, error: fetchError } = await supabase
    .from("artifacts")
    .select("content")
    .eq("id", artifactId)
    .eq("workspace_id", workspaceId)
    .single();

  if (fetchError || !artifact) {
    return { status: "error", message: "That artifact could not be found." };
  }

  const { error: insertError } = await supabase.from("artifact_versions").insert({
    artifact_id: artifactId,
    workspace_id: workspaceId,
    created_by: user.id,
    content: artifact.content
  });

  if (insertError) {
    return { status: "error", message: "That version could not be saved." };
  }

  revalidatePath(`/workspace/projects/${projectId}/artifacts/${artifactId}`);

  return { status: "idle" };
}

/**
 * Restoring never overwrites history (Product Definition §30): it copies
 * a past version's content back onto the live artifact, then records
 * that restored state as a brand new version -- the old version row is
 * untouched, and the act of restoring is itself now part of the history.
 */
export async function restoreArtifactVersionAction(
  _prevState: VersionActionState,
  formData: FormData
): Promise<VersionActionState> {
  const versionId = String(formData.get("versionId") ?? "");
  const artifactId = String(formData.get("artifactId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const workspaceId = String(formData.get("workspaceId") ?? "");

  if (!versionId || !artifactId || !projectId || !workspaceId) {
    return { status: "error", message: "That version could not be found." };
  }

  const { supabase, user } = await requireUser();

  const { data: version, error: fetchError } = await supabase
    .from("artifact_versions")
    .select("content")
    .eq("id", versionId)
    .eq("artifact_id", artifactId)
    .eq("workspace_id", workspaceId)
    .single();

  if (fetchError || !version) {
    return { status: "error", message: "That version could not be found." };
  }

  // Restoring changes live content just like a direct edit does -- also
  // resets status to draft (Milestone 15) so an "Approved"/"Rejected"
  // badge can never silently diverge from what was actually reviewed.
  const { error: updateError } = await supabase
    .from("artifacts")
    .update({ content: version.content, status: "draft" })
    .eq("id", artifactId)
    .select()
    .single();

  if (updateError) {
    return { status: "error", message: "That version could not be restored." };
  }

  const { error: insertError } = await supabase.from("artifact_versions").insert({
    artifact_id: artifactId,
    workspace_id: workspaceId,
    created_by: user.id,
    content: version.content
  });

  if (insertError) {
    logError("restore_artifact_version_history_insert_failed", {
      artifactId,
      versionId,
      workspaceId,
      message: insertError.message
    });
  }

  revalidatePath(`/workspace/projects/${projectId}/artifacts/${artifactId}`);

  return { status: "idle" };
}
