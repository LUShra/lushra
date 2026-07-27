"use server";

import { redirect } from "next/navigation";

import { logError } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";

export type ProjectActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: {
    name?: string;
    description?: string;
    purpose?: string;
    desiredOutcome?: string;
    keyConstraints?: string;
    targetAudience?: string;
  };
};

/** Trims a field to null-if-blank, then rejects it if it exceeds maxLength. */
function normalizeContextField(
  value: FormDataEntryValue | null,
  maxLength: number
): { value: string | null; tooLong: boolean } {
  const trimmed = String(value ?? "").trim();
  const normalized = trimmed.length > 0 ? trimmed : null;

  return { value: normalized, tooLong: Boolean(normalized && normalized.length > maxLength) };
}

/**
 * Every action re-establishes the current user server-side rather than
 * trusting a value threaded in from the page -- these actions are only
 * ever reachable from behind the workspace layout's own auth check, but
 * a session can still expire between page load and form submission.
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

export async function createProjectAction(
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!workspaceId) {
    return { status: "error", message: "Your workspace could not be found." };
  }

  if (!name) {
    return { status: "error", fieldErrors: { name: "Enter a project name." } };
  }

  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("projects").insert({
    workspace_id: workspaceId,
    owner_id: user.id,
    name
  });

  if (error) {
    logError("create_project_failed", { workspaceId, message: error.message });
    return { status: "error", message: "That project could not be created." };
  }

  redirect("/workspace/projects");
}

export async function renameProjectAction(
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const projectId = String(formData.get("projectId") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!projectId) {
    return { status: "error", message: "That project could not be found." };
  }

  if (!name) {
    return { status: "error", fieldErrors: { name: "Enter a project name." } };
  }

  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("projects")
    .update({ name })
    .eq("id", projectId)
    .select()
    .single();

  if (error) {
    logError("rename_project_failed", { projectId, message: error.message });
    return { status: "error", message: "That project could not be renamed." };
  }

  redirect("/workspace/projects");
}

export async function updateProjectDescriptionAction(
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const projectId = String(formData.get("projectId") ?? "");
  const rawDescription = String(formData.get("description") ?? "").trim();
  const description = rawDescription.length > 0 ? rawDescription : null;

  if (!projectId) {
    return { status: "error", message: "That project could not be found." };
  }

  if (description && description.length > 2000) {
    return {
      status: "error",
      fieldErrors: { description: "Description must be 2000 characters or fewer." }
    };
  }

  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("projects")
    .update({ description })
    .eq("id", projectId)
    .select()
    .single();

  if (error) {
    logError("update_project_description_failed", { projectId, message: error.message });
    return { status: "error", message: "That project's description could not be saved." };
  }

  redirect(`/workspace/projects/${projectId}`);
}

export async function updateProjectContextAction(
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const projectId = String(formData.get("projectId") ?? "");

  if (!projectId) {
    return { status: "error", message: "That project could not be found." };
  }

  const purpose = normalizeContextField(formData.get("purpose"), 500);
  const desiredOutcome = normalizeContextField(formData.get("desiredOutcome"), 500);
  const keyConstraints = normalizeContextField(formData.get("keyConstraints"), 1000);
  const targetAudience = normalizeContextField(formData.get("targetAudience"), 500);

  const fieldErrors: NonNullable<ProjectActionState["fieldErrors"]> = {};

  if (purpose.tooLong) {
    fieldErrors.purpose = "Purpose must be 500 characters or fewer.";
  }

  if (desiredOutcome.tooLong) {
    fieldErrors.desiredOutcome = "Desired outcome must be 500 characters or fewer.";
  }

  if (keyConstraints.tooLong) {
    fieldErrors.keyConstraints = "Key constraints must be 1000 characters or fewer.";
  }

  if (targetAudience.tooLong) {
    fieldErrors.targetAudience = "Target audience must be 500 characters or fewer.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", fieldErrors };
  }

  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("projects")
    .update({
      purpose: purpose.value,
      desired_outcome: desiredOutcome.value,
      key_constraints: keyConstraints.value,
      target_audience: targetAudience.value
    })
    .eq("id", projectId)
    .select()
    .single();

  if (error) {
    logError("update_project_context_failed", { projectId, message: error.message });
    return { status: "error", message: "That project's context could not be saved." };
  }

  redirect(`/workspace/projects/${projectId}`);
}

export async function archiveProjectAction(
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const projectId = String(formData.get("projectId") ?? "");

  if (!projectId) {
    return { status: "error", message: "That project could not be found." };
  }

  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("projects")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("id", projectId)
    .select()
    .single();

  if (error) {
    logError("archive_project_failed", { projectId, message: error.message });
    return { status: "error", message: "That project could not be archived." };
  }

  redirect("/workspace/projects");
}

export async function restoreProjectAction(
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const projectId = String(formData.get("projectId") ?? "");

  if (!projectId) {
    return { status: "error", message: "That project could not be found." };
  }

  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("projects")
    .update({ status: "active", archived_at: null })
    .eq("id", projectId)
    .select()
    .single();

  if (error) {
    logError("restore_project_failed", { projectId, message: error.message });
    return { status: "error", message: "That project could not be restored." };
  }

  redirect("/workspace/projects");
}
