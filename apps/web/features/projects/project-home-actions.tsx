"use client";

import { useActionState } from "react";

import { Button, FormMessage, Inline } from "@lushra/ui";

import {
  archiveProjectAction,
  restoreProjectAction,
  type ProjectActionState
} from "./project-actions";

const initialState: ProjectActionState = { status: "idle" };

export type ProjectHomeActionsProps = {
  projectId: string;
  isArchived: boolean;
};

/**
 * Reuses the exact same archiveProjectAction/restoreProjectAction from
 * the projects list (apps/web/features/projects/project-list-item.tsx)
 * -- this is a second presentation of the same server-authoritative
 * action, not a duplicated implementation.
 */
export function ProjectHomeActions({ projectId, isArchived }: ProjectHomeActionsProps) {
  const [archiveState, archiveFormAction, isArchivePending] = useActionState(
    archiveProjectAction,
    initialState
  );
  const [restoreState, restoreFormAction, isRestorePending] = useActionState(
    restoreProjectAction,
    initialState
  );

  return (
    <Inline align="center" gap={3} wrap>
      {isArchived ? (
        <form action={restoreFormAction}>
          <input name="projectId" type="hidden" value={projectId} />
          <Button loading={isRestorePending} size="small" type="submit" variant="secondary">
            Restore project
          </Button>
        </form>
      ) : (
        <form action={archiveFormAction}>
          <input name="projectId" type="hidden" value={projectId} />
          <Button loading={isArchivePending} size="small" type="submit" variant="secondary">
            Archive project
          </Button>
        </form>
      )}

      {archiveState.status === "error" && archiveState.message ? (
        <FormMessage tone="error">{archiveState.message}</FormMessage>
      ) : null}

      {restoreState.status === "error" && restoreState.message ? (
        <FormMessage tone="error">{restoreState.message}</FormMessage>
      ) : null}
    </Inline>
  );
}
