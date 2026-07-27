"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ReviewActionState = {
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

  return { supabase };
}

/**
 * Every transition below filters the UPDATE by its required starting
 * status (e.g. `.eq("status", "draft")`), not just by id. This makes the
 * check atomic and race-safe -- there is no separate read-then-write step
 * that could observe a stale status -- and it means an invalid transition
 * (already submitted, already approved, a stale double-click) surfaces as
 * a genuine zero-row honest failure via .select().single(), never a
 * silent no-op success.
 */
async function transitionArtifactStatus(
  formData: FormData,
  fromStatuses: string[],
  toStatus: string,
  failureMessage: string
): Promise<ReviewActionState> {
  const artifactId = String(formData.get("artifactId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");

  if (!artifactId || !projectId) {
    return { status: "error", message: "That artifact could not be found." };
  }

  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("artifacts")
    .update({ status: toStatus })
    .eq("id", artifactId)
    .in("status", fromStatuses)
    .select()
    .single();

  if (error) {
    return { status: "error", message: failureMessage };
  }

  revalidatePath(`/workspace/projects/${projectId}/artifacts/${artifactId}`);

  return { status: "idle" };
}

export async function submitForReviewAction(
  _prevState: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  return transitionArtifactStatus(
    formData,
    ["draft"],
    "in_review",
    "That artifact could not be submitted for review."
  );
}

/** Product Definition §17: approval is always a human action taken here -- no code path lets AI-authored content call this. */
export async function approveArtifactAction(
  _prevState: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  return transitionArtifactStatus(
    formData,
    ["in_review"],
    "approved",
    "That artifact could not be approved."
  );
}

export async function rejectArtifactAction(
  _prevState: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  return transitionArtifactStatus(
    formData,
    ["in_review"],
    "rejected",
    "That artifact could not be rejected."
  );
}

export async function reopenArtifactAction(
  _prevState: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  return transitionArtifactStatus(
    formData,
    ["approved", "rejected"],
    "draft",
    "That artifact could not be reopened."
  );
}
