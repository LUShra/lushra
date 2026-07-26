"use client";

import { useActionState } from "react";

import { Button, Field, FormMessage, Label, Stack, Textarea } from "@lushra/ui";

import type { Project } from "./list-projects";
import { updateProjectDescriptionAction, type ProjectActionState } from "./project-actions";

const initialState: ProjectActionState = { status: "idle" };

export type ProjectDescriptionFormProps = {
  project: Project;
};

export function ProjectDescriptionForm({ project }: ProjectDescriptionFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProjectDescriptionAction,
    initialState
  );
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate>
      <Stack gap={4}>
        <input name="projectId" type="hidden" value={project.id} />

        <Field invalid={Boolean(fieldErrors.description)}>
          <Label>Description</Label>
          <Textarea
            defaultValue={project.description ?? ""}
            maxLength={2000}
            name="description"
            placeholder="What is this project for?"
            rows={5}
          />
          {fieldErrors.description ? (
            <FormMessage tone="error">{fieldErrors.description}</FormMessage>
          ) : null}
        </Field>

        {state.status === "error" && state.message ? (
          <FormMessage tone="error">{state.message}</FormMessage>
        ) : null}

        <Button loading={isPending} size="small" type="submit">
          Save description
        </Button>
      </Stack>
    </form>
  );
}
