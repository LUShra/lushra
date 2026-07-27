import { Badge, Card, Inline, Text } from "@lushra/ui";
import Link from "next/link";

import { ARTIFACT_STATUS_BADGE_VARIANTS, ARTIFACT_STATUS_LABELS, type ArtifactStatus } from "./artifact-status";
import { ARTIFACT_TYPE_LABELS, type ArtifactType } from "./artifact-types";
import type { Artifact } from "./list-artifacts";

export type ArtifactListItemProps = {
  projectId: string;
  artifact: Artifact;
};

export function ArtifactListItem({ projectId, artifact }: ArtifactListItemProps) {
  const typeLabel = ARTIFACT_TYPE_LABELS[artifact.type as ArtifactType] ?? artifact.type;
  const status = artifact.status as ArtifactStatus;

  return (
    <Card variant="raised">
      <Inline align="center" gap={4} justify="between">
        <Link href={`/workspace/projects/${projectId}/artifacts/${artifact.id}`}>
          {artifact.title}
        </Link>
        <Inline align="center" gap={3}>
          <Text color="secondary">{typeLabel}</Text>
          <Badge variant={ARTIFACT_STATUS_BADGE_VARIANTS[status]}>
            {ARTIFACT_STATUS_LABELS[status]}
          </Badge>
        </Inline>
      </Inline>
    </Card>
  );
}
