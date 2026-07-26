import { Card, Inline, Text } from "@lushra/ui";
import Link from "next/link";

import type { Artifact } from "./list-artifacts";
import { ARTIFACT_TYPE_LABELS, type ArtifactType } from "./artifact-actions";

export type ArtifactListItemProps = {
  projectId: string;
  artifact: Artifact;
};

export function ArtifactListItem({ projectId, artifact }: ArtifactListItemProps) {
  const typeLabel = ARTIFACT_TYPE_LABELS[artifact.type as ArtifactType] ?? artifact.type;

  return (
    <Card variant="raised">
      <Inline align="center" gap={4} justify="between">
        <Link href={`/workspace/projects/${projectId}/artifacts/${artifact.id}`}>
          {artifact.title}
        </Link>
        <Text color="secondary">{typeLabel}</Text>
      </Inline>
    </Card>
  );
}
