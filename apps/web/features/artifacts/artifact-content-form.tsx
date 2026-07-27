"use client";

import { useActionState } from "react";

import { Button, Field, FormMessage, Label, Stack, Textarea } from "@lushra/ui";

import type { Artifact } from "./list-artifacts";
import { updateArtifactContentAction, type ArtifactActionState } from "./artifact-actions";

const initialState: ArtifactActionState = { status: "idle" };

export type ArtifactContentFormProps = {
  artifact: Artifact;
};

export function ArtifactContentForm({ artifact }: ArtifactContentFormProps) {
  const [state, formAction, isPending] = useActionState(updateArtifactContentAction, initialState);
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate>
      <Stack gap={4}>
        <input name="artifactId" type="hidden" value={artifact.id} />
        <input name="projectId" type="hidden" value={artifact.project_id} />

        <Field invalid={Boolean(fieldErrors.content)}>
          <Label>Content</Label>
          <Textarea
            defaultValue={artifact.content ?? ""}
            maxLength={50000}
            name="content"
            placeholder="Write the artifact's content..."
            rows={16}
          />
          {fieldErrors.content ? (
            <FormMessage tone="error">{fieldErrors.content}</FormMessage>
          ) : null}
        </Field>

        {state.status === "error" && state.message ? (
          <FormMessage tone="error">{state.message}</FormMessage>
        ) : null}

        <Button loading={isPending} size="small" type="submit">
          Save content
        </Button>
      </Stack>
    </form>
  );
}
