import { Card, Heading, Stack, Text } from "@lushra/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageFrame } from "@/components/layout/page-frame";
import { ArtifactContentForm } from "@/features/artifacts/artifact-content-form";
import { ArtifactRenameForm } from "@/features/artifacts/artifact-rename-form";
import { ARTIFACT_TYPE_LABELS, type ArtifactType } from "@/features/artifacts/artifact-types";
import { getArtifact } from "@/features/artifacts/list-artifacts";
import { getProject } from "@/features/projects/list-projects";
import { getOrCreatePersonalWorkspace } from "@/features/workspace/get-or-create-personal-workspace";

type ArtifactPageProps = {
  params: Promise<{ id: string; artifactId: string }>;
};

export default async function ArtifactPage({ params }: ArtifactPageProps) {
  const { id: projectId, artifactId } = await params;
  const workspaceResult = await getOrCreatePersonalWorkspace();

  if (workspaceResult.status === "error") {
    return (
      <PageFrame eyebrow="Artifact" title="Artifact">
        <Text color="secondary">
          We couldn&apos;t load your workspace right now. Try reloading the page.
        </Text>
      </PageFrame>
    );
  }

  const workspaceId = workspaceResult.workspace.id;

  const projectResult = await getProject(projectId, workspaceId);

  if (projectResult.status === "error") {
    notFound();
  }

  const artifactResult = await getArtifact(artifactId, projectId, workspaceId);

  if (artifactResult.status === "error") {
    notFound();
  }

  const { project } = projectResult;
  const { artifact } = artifactResult;
  const typeLabel = ARTIFACT_TYPE_LABELS[artifact.type as ArtifactType] ?? artifact.type;

  return (
    <PageFrame
      actions={<Link href={`/workspace/projects/${project.id}`}>Back to {project.name}</Link>}
      description={typeLabel}
      eyebrow="Artifact"
      title={artifact.title}
    >
      <Stack gap={8}>
        <Card variant="inset">
          <Stack gap={4}>
            <Heading level={2} visualRole="heading-4">
              Title
            </Heading>
            <ArtifactRenameForm artifact={artifact} />
          </Stack>
        </Card>

        <Card variant="inset">
          <Stack gap={4}>
            <Heading level={2} visualRole="heading-4">
              Content
            </Heading>
            <ArtifactContentForm artifact={artifact} />
          </Stack>
        </Card>
      </Stack>
    </PageFrame>
  );
}
