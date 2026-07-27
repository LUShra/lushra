"use server";

import { redirect } from "next/navigation";

import { logError } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";
import { SOURCE_TYPES, type SourceType } from "./source-types";

export type SourceActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: {
    title?: string;
    type?: string;
    url?: string;
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

function isSourceType(value: string): value is SourceType {
  return (SOURCE_TYPES as readonly string[]).includes(value);
}

/** Only http/https are accepted -- matches what a browser can safely navigate to. */
function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function createSourceAction(
  _prevState: SourceActionState,
  formData: FormData
): Promise<SourceActionState> {
  const projectId = String(formData.get("projectId") ?? "");
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const rawUrl = String(formData.get("url") ?? "").trim();
  const rawContent = String(formData.get("content") ?? "");

  if (!projectId || !workspaceId) {
    return { status: "error", message: "That project could not be found." };
  }

  if (!title) {
    return { status: "error", fieldErrors: { title: "Enter a title." } };
  }

  if (title.length > 200) {
    return { status: "error", fieldErrors: { title: "Title must be 200 characters or fewer." } };
  }

  if (!isSourceType(type)) {
    return { status: "error", fieldErrors: { type: "Choose a source type." } };
  }

  let url: string | null = null;
  let content: string | null = null;

  if (type === "link") {
    if (!rawUrl) {
      return { status: "error", fieldErrors: { url: "Enter a URL." } };
    }

    if (!isValidHttpUrl(rawUrl)) {
      return { status: "error", fieldErrors: { url: "Enter a valid http:// or https:// URL." } };
    }

    if (rawUrl.length > 2000) {
      return { status: "error", fieldErrors: { url: "URL must be 2,000 characters or fewer." } };
    }

    url = rawUrl;
  } else {
    const trimmedContent = rawContent.trim();

    if (!trimmedContent) {
      return { status: "error", fieldErrors: { content: "Enter the source's content." } };
    }

    if (trimmedContent.length > 50000) {
      return {
        status: "error",
        fieldErrors: { content: "Content must be 50,000 characters or fewer." }
      };
    }

    content = trimmedContent;
  }

  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("sources").insert({
    project_id: projectId,
    workspace_id: workspaceId,
    owner_id: user.id,
    type,
    title,
    url,
    content
  });

  if (error) {
    logError("create_source_failed", { projectId, workspaceId, message: error.message });
    return { status: "error", message: "That source could not be added." };
  }

  redirect(`/workspace/projects/${projectId}`);
}

/**
 * Edits title together with url (for a 'link' source) or content (for a
 * 'text' source) in one call -- sources are simple enough not to need
 * separate rename/content forms the way artifacts do. The source's own
 * type is passed through as a hidden field rather than re-derived, since
 * the caller already knows it from the row being edited; this action
 * still validates against that same type rather than trusting it blindly.
 */
export async function updateSourceAction(
  _prevState: SourceActionState,
  formData: FormData
): Promise<SourceActionState> {
  const sourceId = String(formData.get("sourceId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const type = String(formData.get("type") ?? "");
  const title = String(formData.get("title") ?? "").trim();

  if (!sourceId || !projectId) {
    return { status: "error", message: "That source could not be found." };
  }

  if (!isSourceType(type)) {
    return { status: "error", message: "That source could not be found." };
  }

  if (!title) {
    return { status: "error", fieldErrors: { title: "Enter a title." } };
  }

  if (title.length > 200) {
    return { status: "error", fieldErrors: { title: "Title must be 200 characters or fewer." } };
  }

  const { supabase } = await requireUser();

  if (type === "link") {
    const rawUrl = String(formData.get("url") ?? "").trim();

    if (!rawUrl) {
      return { status: "error", fieldErrors: { url: "Enter a URL." } };
    }

    if (!isValidHttpUrl(rawUrl)) {
      return { status: "error", fieldErrors: { url: "Enter a valid http:// or https:// URL." } };
    }

    if (rawUrl.length > 2000) {
      return { status: "error", fieldErrors: { url: "URL must be 2,000 characters or fewer." } };
    }

    const { error } = await supabase
      .from("sources")
      .update({ title, url: rawUrl })
      .eq("id", sourceId)
      .select()
      .single();

    if (error) {
      logError("update_source_failed", { sourceId, projectId, message: error.message });
      return { status: "error", message: "That source could not be updated." };
    }
  } else {
    const trimmedContent = String(formData.get("content") ?? "").trim();

    if (!trimmedContent) {
      return { status: "error", fieldErrors: { content: "Enter the source's content." } };
    }

    if (trimmedContent.length > 50000) {
      return {
        status: "error",
        fieldErrors: { content: "Content must be 50,000 characters or fewer." }
      };
    }

    const { error } = await supabase
      .from("sources")
      .update({ title, content: trimmedContent })
      .eq("id", sourceId)
      .select()
      .single();

    if (error) {
      logError("update_source_failed", { sourceId, projectId, message: error.message });
      return { status: "error", message: "That source could not be updated." };
    }
  }

  redirect(`/workspace/projects/${projectId}`);
}

/**
 * The first real hard-delete in this project (Product Definition §30:
 * "removal must be complete"). Chains .select().single() the same way
 * every other mutation does -- if RLS filters out a stale or foreign id,
 * the delete affects zero rows, .single() sees no row, and that surfaces
 * as a genuine error rather than a misleading silent "success."
 */
export async function deleteSourceAction(
  _prevState: SourceActionState,
  formData: FormData
): Promise<SourceActionState> {
  const sourceId = String(formData.get("sourceId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");

  if (!sourceId || !projectId) {
    return { status: "error", message: "That source could not be found." };
  }

  const { supabase } = await requireUser();

  const { error } = await supabase.from("sources").delete().eq("id", sourceId).select().single();

  if (error) {
    logError("delete_source_failed", { sourceId, projectId, message: error.message });
    return { status: "error", message: "That source could not be removed." };
  }

  redirect(`/workspace/projects/${projectId}`);
}
