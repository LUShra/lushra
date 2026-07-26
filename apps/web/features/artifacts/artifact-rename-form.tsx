"use client";

import { useActionState } from "react";

import { Button, Field, FormMessage, Input, Label, Stack } from "@lushra/ui";

import type { Artifact } from "./list-artifacts";
import { renameArtifactAction, type ArtifactActionState } from "./artifact-actions";

const initialState: ArtifactActionState = { status: "idle" };

export type ArtifactRenameFormProps = {
  artifact: Artifact;
};

export function ArtifactRenameForm({ artifact }: ArtifactRenameFormProps) {
  const [state, formAction, isPending] = useActionState(renameArtifactAction, initialState);
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate>
      <Stack gap={4}>
        <input name="artifactId" type="hidden" value={artifact.id} />
        <input name="projectId" type="hidden" value={artifact.project_id} />

        <Field invalid={Boolean(fieldErrors.title)}>
          <Label>Title</Label>
          <Input defaultValue={artifact.title} maxLength={200} name="title" required type="text" />
          {fieldErrors.title ? <FormMessage tone="error">{fieldErrors.title}</FormMessage> : null}
        </Field>

        {state.status === "error" && state.message ? (
          <FormMessage tone="error">{state.message}</FormMessage>
        ) : null}

        <Button loading={isPending} size="small" type="submit">
          Save title
        </Button>
      </Stack>
    </form>
  );
}
