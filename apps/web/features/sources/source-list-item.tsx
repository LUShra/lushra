"use client";

import { useActionState, useState } from "react";

import {
  Button,
  Card,
  Field,
  FormMessage,
  Inline,
  Input,
  Label,
  Stack,
  Text,
  Textarea
} from "@lushra/ui";

import type { Source } from "./list-sources";
import { deleteSourceAction, updateSourceAction, type SourceActionState } from "./source-actions";
import { SOURCE_TYPE_LABELS, type SourceType } from "./source-types";

const initialState: SourceActionState = { status: "idle" };

export type SourceListItemProps = {
  source: Source;
  projectId: string;
};

/** Truncates a text source's content for the collapsed list view. */
function previewText(content: string | null): string {
  if (!content) {
    return "";
  }

  const trimmed = content.trim();
  return trimmed.length > 150 ? `${trimmed.slice(0, 150)}…` : trimmed;
}

export function SourceListItem({ source, projectId }: SourceListItemProps) {
  const [mode, setMode] = useState<"view" | "edit" | "confirmDelete">("view");
  const [updateState, updateFormAction, isUpdatePending] = useActionState(
    updateSourceAction,
    initialState
  );
  const [deleteState, deleteFormAction, isDeletePending] = useActionState(
    deleteSourceAction,
    initialState
  );

  const type = source.type as SourceType;
  const typeLabel = SOURCE_TYPE_LABELS[type] ?? source.type;
  const updateFieldErrors = updateState.fieldErrors ?? {};

  if (mode === "edit") {
    return (
      <Card variant="raised">
        <form action={updateFormAction}>
          <Stack gap={3}>
            <input name="sourceId" type="hidden" value={source.id} />
            <input name="projectId" type="hidden" value={projectId} />
            <input name="type" type="hidden" value={source.type} />

            <Field invalid={Boolean(updateFieldErrors.title)}>
              <Label>Title</Label>
              <Input
                defaultValue={source.title}
                maxLength={200}
                name="title"
                required
                type="text"
              />
              {updateFieldErrors.title ? (
                <FormMessage tone="error">{updateFieldErrors.title}</FormMessage>
              ) : null}
            </Field>

            {type === "link" ? (
              <Field invalid={Boolean(updateFieldErrors.url)}>
                <Label>URL</Label>
                <Input defaultValue={source.url ?? ""} maxLength={2000} name="url" type="url" />
                {updateFieldErrors.url ? (
                  <FormMessage tone="error">{updateFieldErrors.url}</FormMessage>
                ) : null}
              </Field>
            ) : (
              <Field invalid={Boolean(updateFieldErrors.content)}>
                <Label>Content</Label>
                <Textarea
                  defaultValue={source.content ?? ""}
                  maxLength={50000}
                  name="content"
                  rows={6}
                />
                {updateFieldErrors.content ? (
                  <FormMessage tone="error">{updateFieldErrors.content}</FormMessage>
                ) : null}
              </Field>
            )}

            {updateState.status === "error" && updateState.message ? (
              <FormMessage tone="error">{updateState.message}</FormMessage>
            ) : null}

            <Inline gap={3}>
              <Button loading={isUpdatePending} size="small" type="submit">
                Save
              </Button>
              <Button
                onClick={() => setMode("view")}
                size="small"
                type="button"
                variant="secondary"
              >
                Cancel
              </Button>
            </Inline>
          </Stack>
        </form>
      </Card>
    );
  }

  if (mode === "confirmDelete") {
    return (
      <Card variant="raised">
        <Stack gap={3}>
          <Text color="secondary">
            Remove &quot;{source.title}&quot;? This cannot be undone.
          </Text>

          <form action={deleteFormAction}>
            <input name="sourceId" type="hidden" value={source.id} />
            <input name="projectId" type="hidden" value={projectId} />
            <Inline gap={3}>
              <Button loading={isDeletePending} size="small" type="submit" variant="danger">
                Confirm removal
              </Button>
              <Button
                onClick={() => setMode("view")}
                size="small"
                type="button"
                variant="secondary"
              >
                Cancel
              </Button>
            </Inline>
          </form>

          {deleteState.status === "error" && deleteState.message ? (
            <FormMessage tone="error">{deleteState.message}</FormMessage>
          ) : null}
        </Stack>
      </Card>
    );
  }

  return (
    <Card variant="raised">
      <Stack gap={2}>
        <Inline align="center" gap={4} justify="between">
          <Text>{source.title}</Text>
          <Text color="secondary">{typeLabel}</Text>
        </Inline>

        {type === "link" && source.url ? (
          <Text color="secondary">
            <a href={source.url} rel="noreferrer noopener" target="_blank">
              {source.url}
            </a>
          </Text>
        ) : (
          <Text color="secondary">{previewText(source.content)}</Text>
        )}

        <Inline gap={3}>
          <Button onClick={() => setMode("edit")} size="small" type="button" variant="secondary">
            Edit
          </Button>
          <Button
            onClick={() => setMode("confirmDelete")}
            size="small"
            type="button"
            variant="secondary"
          >
            Remove
          </Button>
        </Inline>
      </Stack>
    </Card>
  );
}
