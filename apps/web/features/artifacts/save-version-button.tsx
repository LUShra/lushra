"use client";

import { useActionState } from "react";

import { Button, FormMessage } from "@lushra/ui";

import { saveArtifactVersionAction, type VersionActionState } from "./version-actions";

const initialState: VersionActionState = { status: "idle" };

export type SaveVersionButtonProps = {
  artifactId: string;
  projectId: string;
  workspaceId: string;
};

export function SaveVersionButton({ artifactId, projectId, workspaceId }: SaveVersionButtonProps) {
  const [state, formAction, isPending] = useActionState(saveArtifactVersionAction, initialState);

  return (
    <form action={formAction}>
      <input name="artifactId" type="hidden" value={artifactId} />
      <input name="projectId" type="hidden" value={projectId} />
      <input name="workspaceId" type="hidden" value={workspaceId} />

      <Button loading={isPending} size="small" type="submit" variant="secondary">
        Save version
      </Button>

      {state.status === "error" && state.message ? (
        <FormMessage tone="error">{state.message}</FormMessage>
      ) : null}
    </form>
  );
}
