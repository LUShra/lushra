"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const ARTIFACT_TYPES = [
  "brief",
  "specification",
  "structured_document",
  "marketing_copy",
  "research_synthesis",
  "content_outline"
] as const;

export type ArtifactType = (typeof ARTIFACT_TYPES)[number];

export const ARTIFACT_TYPE_LABELS: Record<ArtifactType, string> = {
  brief: "Brief",
  specification: "Specification",
  structured_document: "Structured document",
  marketing_copy: "Marketing copy",
  research_synthesis: "Research synthesis",
  content_outline: "Content outline"
};

export type ArtifactActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: {
    title?: string;
    type?: string;
    content?: string;
  };
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

function isArtifactType(value: string): value is ArtifactType {
  return (ARTIFACT_TYPES as readonly string[]).includes(value);
}

export async function createArtifactAction(
  _prevState: ArtifactActionState,
  formData: FormData
): Promise<ArtifactActionState> {
  const projectId = String(formData.get("projectId") ?? "");
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "");

  if (!projectId || !workspaceId) {
    return { status: "error", message: "That project could not be found." };
  }

  if (!title) {
    return { status: "error", fieldErrors: { title: "Enter a title." } };
  }

  if (title.length > 200) {
    return { status: "error", fieldErrors: { title: "Title must be 200 characters or fewer." } };
  }

  if (!isArtifactType(type)) {
    return { status: "error", fieldErrors: { type: "Choose an artifact type." } };
  }

  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("artifacts")
    .insert({
      project_id: projectId,
      workspace_id: workspaceId,
      owner_id: user.id,
      title,
      type
    })
    .select()
    .single();

  if (error || !data) {
    return { status: "error", message: "That artifact could not be created." };
  }

  redirect(`/workspace/projects/${projectId}/artifacts/${data.id}`);
}

/**
 * The First-Value Journey bridge (Experience Architecture §13): converts
 * a session message directly into a durable artifact. Title is derived
 * from the message's first line since this is a one-click action with no
 * form -- renameArtifactAction lets the user replace it afterwards. Type
 * defaults to 'brief', the closest general-purpose category; there is no
 * type picker in this one-click path by design.
 */
export async function createArtifactFromMessageAction(
  _prevState: ArtifactActionState,
  formData: FormData
): Promise<ArtifactActionState> {
  const projectId = String(formData.get("projectId") ?? "");
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const content = String(formData.get("content") ?? "");

  if (!projectId || !workspaceId) {
    return { status: "error", message: "That project could not be found." };
  }

  const firstLine = content.split("\n")[0]?.trim() ?? "";
  const title = firstLine.length > 0 ? firstLine.slice(0, 200) : "Untitled artifact";

  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("artifacts")
    .insert({
      project_id: projectId,
      workspace_id: workspaceId,
      owner_id: user.id,
      title,
      type: "brief",
      content
    })
    .select()
    .single();

  if (error || !data) {
    return { status: "error", message: "That message could not be saved as an artifact." };
  }

  redirect(`/workspace/projects/${projectId}/artifacts/${data.id}`);
}

export async function renameArtifactAction(
  _prevState: ArtifactActionState,
  formData: FormData
): Promise<ArtifactActionState> {
  const artifactId = String(formData.get("artifactId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim();

  if (!artifactId || !projectId) {
    return { status: "error", message: "That artifact could not be found." };
  }

  if (!title) {
    return { status: "error", fieldErrors: { title: "Enter a title." } };
  }

  if (title.length > 200) {
    return { status: "error", fieldErrors: { title: "Title must be 200 characters or fewer." } };
  }

  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("artifacts")
    .update({ title })
    .eq("id", artifactId)
    .select()
    .single();

  if (error) {
    return { status: "error", message: "That artifact could not be renamed." };
  }

  redirect(`/workspace/projects/${projectId}/artifacts/${artifactId}`);
}

export async function updateArtifactContentAction(
  _prevState: ArtifactActionState,
  formData: FormData
): Promise<ArtifactActionState> {
  const artifactId = String(formData.get("artifactId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const rawContent = String(formData.get("content") ?? "");
  const content = rawContent.trim().length > 0 ? rawContent : null;

  if (!artifactId || !projectId) {
    return { status: "error", message: "That artifact could not be found." };
  }

  if (content && content.length > 50000) {
    return {
      status: "error",
      fieldErrors: { content: "Content must be 50,000 characters or fewer." }
    };
  }

  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("artifacts")
    .update({ content })
    .eq("id", artifactId)
    .select()
    .single();

  if (error) {
    return { status: "error", message: "That artifact's content could not be saved." };
  }

  redirect(`/workspace/projects/${projectId}/artifacts/${artifactId}`);
}
