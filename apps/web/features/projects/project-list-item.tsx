"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import {
  Button,
  Card,
  Field,
  FormMessage,
  Heading,
  Input,
  Inline,
  Label,
  Stack,
  Text
} from "@lushra/ui";
import Link from "next/link";

import type { Project } from "./list-projects";
import {
  archiveProjectAction,
  renameProjectAction,
  restoreProjectAction,
  type ProjectActionState
} from "./project-actions";

const initialState: ProjectActionState = { status: "idle" };

export type ProjectListItemProps = {
  project: Project;
};

export function ProjectListItem({ project }: ProjectListItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameState, renameFormAction, isRenamePending] = useActionState(
    renameProjectAction,
    initialState
  );
  const [archiveState, archiveFormAction, isArchivePending] = useActionState(
    archiveProjectAction,
    initialState
  );
  const [restoreState, restoreFormAction, isRestorePending] = useActionState(
    restoreProjectAction,
    initialState
  );

  const isArchived = project.status === "archived";

  const nameInputRef = useRef<HTMLInputElement>(null);
  const renameButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusOnCancelRef = useRef(false);

  /**
   * Renaming swaps this card's heading+button for a form entirely rather
   * than showing/hiding a persistent element, so without this, activating
   * Rename (or cancelling out of it) drops keyboard/screen-reader focus
   * to the document body -- the trigger button is gone from the DOM by
   * the time React re-renders.
   */
  useEffect(() => {
    if (isRenaming) {
      nameInputRef.current?.focus();
    } else if (returnFocusOnCancelRef.current) {
      renameButtonRef.current?.focus();
      returnFocusOnCancelRef.current = false;
    }
  }, [isRenaming]);

  function cancelRename() {
    returnFocusOnCancelRef.current = true;
    setIsRenaming(false);
  }

  return (
    <Card variant="raised">
      <Stack gap={4}>
        {isRenaming ? (
          <form action={renameFormAction}>
            <Stack gap={3}>
              <input name="projectId" type="hidden" value={project.id} />

              <Field invalid={Boolean(renameState.fieldErrors?.name)}>
                <Label>Project name</Label>
                <Input
                  defaultValue={project.name}
                  maxLength={160}
                  name="name"
                  ref={nameInputRef}
                  required
                  type="text"
                />
                {renameState.fieldErrors?.name ? (
                  <FormMessage tone="error">{renameState.fieldErrors.name}</FormMessage>
                ) : null}
              </Field>

              {renameState.status === "error" && renameState.message ? (
                <FormMessage tone="error">{renameState.message}</FormMessage>
              ) : null}

              <Inline gap={3}>
                <Button loading={isRenamePending} size="small" type="submit">
                  Save
                </Button>
                <Button onClick={cancelRename} size="small" type="button" variant="secondary">
                  Cancel
                </Button>
              </Inline>
            </Stack>
          </form>
        ) : (
          <Inline align="center" gap={4} justify="between">
            <Stack gap={1}>
              <Heading level={2} visualRole="heading-4">
                <Link href={`/workspace/projects/${project.id}`}>{project.name}</Link>
              </Heading>
              <Text color="secondary">{isArchived ? "Archived" : "Active"}</Text>
            </Stack>

            <Button
              onClick={() => setIsRenaming(true)}
              ref={renameButtonRef}
              size="small"
              type="button"
              variant="secondary"
            >
              Rename
            </Button>
          </Inline>
        )}

        {!isRenaming ? (
          <Inline gap={3}>
            {isArchived ? (
              <form action={restoreFormAction}>
                <input name="projectId" type="hidden" value={project.id} />
                <Button loading={isRestorePending} size="small" type="submit" variant="secondary">
                  Restore
                </Button>
              </form>
            ) : (
              <form action={archiveFormAction}>
                <input name="projectId" type="hidden" value={project.id} />
                <Button loading={isArchivePending} size="small" type="submit" variant="secondary">
                  Archive
                </Button>
              </form>
            )}
          </Inline>
        ) : null}

        {archiveState.status === "error" && archiveState.message ? (
          <FormMessage tone="error">{archiveState.message}</FormMessage>
        ) : null}

        {restoreState.status === "error" && restoreState.message ? (
          <FormMessage tone="error">{restoreState.message}</FormMessage>
        ) : null}
      </Stack>
    </Card>
  );
}
