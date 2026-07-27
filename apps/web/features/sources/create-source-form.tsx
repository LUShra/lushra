"use client";

import { useActionState, useState } from "react";

import { Button, Field, FormMessage, Input, Label, Select, Stack, Textarea } from "@lushra/ui";

import { createSourceAction, type SourceActionState } from "./source-actions";
import { SOURCE_TYPES, SOURCE_TYPE_LABELS, type SourceType } from "./source-types";

const initialState: SourceActionState = { status: "idle" };

export type CreateSourceFormProps = {
  projectId: string;
  workspaceId: string;
};

export function CreateSourceForm({ projectId, workspaceId }: CreateSourceFormProps) {
  const [state, formAction, isPending] = useActionState(createSourceAction, initialState);
  const [type, setType] = useState<SourceType>("link");
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate>
      <Stack gap={4}>
        <input name="projectId" type="hidden" value={projectId} />
        <input name="workspaceId" type="hidden" value={workspaceId} />

        <Field invalid={Boolean(fieldErrors.title)}>
          <Label>Title</Label>
          <Input maxLength={200} name="title" placeholder="New source" required type="text" />
          {fieldErrors.title ? <FormMessage tone="error">{fieldErrors.title}</FormMessage> : null}
        </Field>

        <Field invalid={Boolean(fieldErrors.type)}>
          <Label>Type</Label>
          <Select
            name="type"
            onChange={(event) => setType(event.target.value as SourceType)}
            value={type}
          >
            {SOURCE_TYPES.map((sourceType) => (
              <option key={sourceType} value={sourceType}>
                {SOURCE_TYPE_LABELS[sourceType]}
              </option>
            ))}
          </Select>
          {fieldErrors.type ? <FormMessage tone="error">{fieldErrors.type}</FormMessage> : null}
        </Field>

        {type === "link" ? (
          <Field invalid={Boolean(fieldErrors.url)}>
            <Label>URL</Label>
            <Input maxLength={2000} name="url" placeholder="https://example.com" type="url" />
            {fieldErrors.url ? <FormMessage tone="error">{fieldErrors.url}</FormMessage> : null}
          </Field>
        ) : (
          <Field invalid={Boolean(fieldErrors.content)}>
            <Label>Content</Label>
            <Textarea
              maxLength={50000}
              name="content"
              placeholder="Paste the source's content..."
              rows={6}
            />
            {fieldErrors.content ? (
              <FormMessage tone="error">{fieldErrors.content}</FormMessage>
            ) : null}
          </Field>
        )}

        {state.status === "error" && state.message ? (
          <FormMessage tone="error">{state.message}</FormMessage>
        ) : null}

        <Button loading={isPending} type="submit">
          Add source
        </Button>
      </Stack>
    </form>
  );
}
