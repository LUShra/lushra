"use client";

import { useActionState } from "react";

import { Button, Card, FormMessage, Inline, Text } from "@lushra/ui";

import type { ArtifactVersion } from "./list-versions";
import { restoreArtifactVersionAction, type VersionActionState } from "./version-actions";

const initialState: VersionActionState = { status: "idle" };

export type VersionListItemProps = {
  version: ArtifactVersion;
  versionNumber: number;
  artifactId: string;
  projectId: string;
  workspaceId: string;
};

export function VersionListItem({
  version,
  versionNumber,
  artifactId,
  projectId,
  workspaceId
}: VersionListItemProps) {
  const [state, formAction, isPending] = useActionState(
    restoreArtifactVersionAction,
    initialState
  );

  const savedAt = new Date(version.created_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
    <Card variant="raised">
      <Inline align="center" gap={4} justify="between">
        <Text color="secondary">
          Version {versionNumber} · {savedAt}
        </Text>

        <form action={formAction}>
          <input name="versionId" type="hidden" value={version.id} />
          <input name="artifactId" type="hidden" value={artifactId} />
          <input name="projectId" type="hidden" value={projectId} />
          <input name="workspaceId" type="hidden" value={workspaceId} />

          <Button loading={isPending} size="small" type="submit" variant="subtle">
            Restore
          </Button>
        </form>
      </Inline>

      {state.status === "error" && state.message ? (
        <FormMessage tone="error">{state.message}</FormMessage>
      ) : null}
    </Card>
  );
}
