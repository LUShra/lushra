"use client";

import { useActionState } from "react";

import { Button, FormMessage } from "@lushra/ui";

import { createSessionAction, type SessionActionState } from "./session-actions";

const initialState: SessionActionState = { status: "idle" };

export type StartSessionFormProps = {
  projectId: string;
  workspaceId: string;
};

export function StartSessionForm({ projectId, workspaceId }: StartSessionFormProps) {
  const [state, formAction, isPending] = useActionState(createSessionAction, initialState);

  return (
    <form action={formAction}>
      <input name="projectId" type="hidden" value={projectId} />
      <input name="workspaceId" type="hidden" value={workspaceId} />

      <Button loading={isPending} size="small" type="submit">
        Start new session
      </Button>

      {state.status === "error" && state.message ? (
        <FormMessage tone="error">{state.message}</FormMessage>
      ) : null}
    </form>
  );
}
