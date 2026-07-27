"use client";

import { useActionState } from "react";

import { Button, FormMessage } from "@lushra/ui";

import { createArtifactFromMessageAction, type ArtifactActionState } from "./artifact-actions";

const initialState: ArtifactActionState = { status: "idle" };

export type SaveAsArtifactButtonProps = {
  projectId: string;
  workspaceId: string;
  content: string;
};

export function SaveAsArtifactButton({
  projectId,
  workspaceId,
  content
}: SaveAsArtifactButtonProps) {
  const [state, formAction, isPending] = useActionState(
    createArtifactFromMessageAction,
    initialState
  );

  return (
    <form action={formAction}>
      <input name="projectId" type="hidden" value={projectId} />
      <input name="workspaceId" type="hidden" value={workspaceId} />
      <input name="content" type="hidden" value={content} />

      <Button loading={isPending} size="small" type="submit" variant="subtle">
        Save as artifact
      </Button>

      {state.status === "error" && state.message ? (
        <FormMessage tone="error">{state.message}</FormMessage>
      ) : null}
    </form>
  );
}
