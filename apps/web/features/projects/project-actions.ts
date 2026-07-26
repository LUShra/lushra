"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ProjectActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: {
    name?: string;
  };
};

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
    return { status: "error", message: error.message };
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
    return { status: "error", message: "That project could not be renamed." };
  }

  redirect("/workspace/projects");
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
    return { status: "error", message: "That project could not be restored." };
  }

  redirect("/workspace/projects");
}
