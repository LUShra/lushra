"use client";

import { useActionState } from "react";

import { Button, Field, FormMessage, Input, Label, Select, Stack } from "@lushra/ui";

import {
  ARTIFACT_TYPES,
  ARTIFACT_TYPE_LABELS,
  createArtifactAction,
  type ArtifactActionState
} from "./artifact-actions";

const initialState: ArtifactActionState = { status: "idle" };

export type CreateArtifactFormProps = {
  projectId: string;
  workspaceId: string;
};

export function CreateArtifactForm({ projectId, workspaceId }: CreateArtifactFormProps) {
  const [state, formAction, isPending] = useActionState(createArtifactAction, initialState);
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate>
      <Stack gap={4}>
        <input name="projectId" type="hidden" value={projectId} />
        <input name="workspaceId" type="hidden" value={workspaceId} />

        <Field invalid={Boolean(fieldErrors.title)}>
          <Label>Title</Label>
          <Input maxLength={200} name="title" placeholder="New artifact" required type="text" />
          {fieldErrors.title ? <FormMessage tone="error">{fieldErrors.title}</FormMessage> : null}
        </Field>

        <Field invalid={Boolean(fieldErrors.type)}>
          <Label>Type</Label>
          <Select defaultValue="" name="type" required>
            <option disabled value="">
              Choose a type
            </option>
            {ARTIFACT_TYPES.map((type) => (
              <option key={type} value={type}>
                {ARTIFACT_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
          {fieldErrors.type ? <FormMessage tone="error">{fieldErrors.type}</FormMessage> : null}
        </Field>

        {state.status === "error" && state.message ? (
          <FormMessage tone="error">{state.message}</FormMessage>
        ) : null}

        <Button loading={isPending} type="submit">
          Create artifact
        </Button>
      </Stack>
    </form>
  );
}
