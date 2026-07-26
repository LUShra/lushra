"use client";

import { useActionState } from "react";

import { Button, Field, FormMessage, Label, Stack, Textarea } from "@lushra/ui";

import type { Project } from "./list-projects";
import { updateProjectContextAction, type ProjectActionState } from "./project-actions";

const initialState: ProjectActionState = { status: "idle" };

export type ProjectContextFormProps = {
  project: Project;
};

export function ProjectContextForm({ project }: ProjectContextFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProjectContextAction,
    initialState
  );
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate>
      <Stack gap={4}>
        <input name="projectId" type="hidden" value={project.id} />

        <Field invalid={Boolean(fieldErrors.purpose)}>
          <Label>Purpose</Label>
          <Textarea
            defaultValue={project.purpose ?? ""}
            maxLength={500}
            name="purpose"
            placeholder="Why does this project exist?"
            rows={3}
          />
          {fieldErrors.purpose ? <FormMessage tone="error">{fieldErrors.purpose}</FormMessage> : null}
        </Field>

        <Field invalid={Boolean(fieldErrors.desiredOutcome)}>
          <Label>Desired outcome</Label>
          <Textarea
            defaultValue={project.desired_outcome ?? ""}
            maxLength={500}
            name="desiredOutcome"
            placeholder="What does success look like?"
            rows={3}
          />
          {fieldErrors.desiredOutcome ? (
            <FormMessage tone="error">{fieldErrors.desiredOutcome}</FormMessage>
          ) : null}
        </Field>

        <Field invalid={Boolean(fieldErrors.keyConstraints)}>
          <Label>Key constraints</Label>
          <Textarea
            defaultValue={project.key_constraints ?? ""}
            maxLength={1000}
            name="keyConstraints"
            placeholder="Anything this project must respect or avoid"
            rows={5}
          />
          {fieldErrors.keyConstraints ? (
            <FormMessage tone="error">{fieldErrors.keyConstraints}</FormMessage>
          ) : null}
        </Field>

        <Field invalid={Boolean(fieldErrors.targetAudience)}>
          <Label>Target audience</Label>
          <Textarea
            defaultValue={project.target_audience ?? ""}
            maxLength={500}
            name="targetAudience"
            placeholder="Who is this project for?"
            rows={3}
          />
          {fieldErrors.targetAudience ? (
            <FormMessage tone="error">{fieldErrors.targetAudience}</FormMessage>
          ) : null}
        </Field>

        {state.status === "error" && state.message ? (
          <FormMessage tone="error">{state.message}</FormMessage>
        ) : null}

        <Button loading={isPending} size="small" type="submit">
          Save context
        </Button>
      </Stack>
    </form>
  );
}
