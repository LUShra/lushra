"use client";

import { useActionState } from "react";

import { Button, Field, FormMessage, Input, Label, Stack } from "@lushra/ui";

import { createProjectAction, type ProjectActionState } from "./project-actions";

const initialState: ProjectActionState = { status: "idle" };

export type CreateProjectFormProps = {
  workspaceId: string;
};

export function CreateProjectForm({ workspaceId }: CreateProjectFormProps) {
  const [state, formAction, isPending] = useActionState(createProjectAction, initialState);
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate>
      <Stack gap={4}>
        <input name="workspaceId" type="hidden" value={workspaceId} />

        <Field invalid={Boolean(fieldErrors.name)}>
          <Label>Project name</Label>
          <Input maxLength={160} name="name" placeholder="New project" required type="text" />
          {fieldErrors.name ? <FormMessage tone="error">{fieldErrors.name}</FormMessage> : null}
        </Field>

        {state.status === "error" && state.message ? (
          <FormMessage tone="error">{state.message}</FormMessage>
        ) : null}

        <Button loading={isPending} type="submit">
          Create project
        </Button>
      </Stack>
    </form>
  );
}
