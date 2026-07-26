import { Card, Heading, Stack, Text } from "@lushra/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageFrame } from "@/components/layout/page-frame";
import { ArtifactListItem } from "@/features/artifacts/artifact-list-item";
import { CreateArtifactForm } from "@/features/artifacts/create-artifact-form";
import { listArtifacts } from "@/features/artifacts/list-artifacts";
import { getProject } from "@/features/projects/list-projects";
import { ProjectContextForm } from "@/features/projects/project-context-form";
import { ProjectDescriptionForm } from "@/features/projects/project-description-form";
import { ProjectHomeActions } from "@/features/projects/project-home-actions";
import { listSessions } from "@/features/sessions/list-sessions";
import { SessionListItem } from "@/features/sessions/session-list-item";
import { StartSessionForm } from "@/features/sessions/start-session-form";
import { getOrCreatePersonalWorkspace } from "@/features/workspace/get-or-create-personal-workspace";

type ProjectHomePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectHomePage({ params }: ProjectHomePageProps) {
  const { id } = await params;
  const workspaceResult = await getOrCreatePersonalWorkspace();

  if (workspaceResult.status === "error") {
    return (
      <PageFrame eyebrow="Workspace" title="Project">
        <Text color="secondary">
          We couldn&apos;t load your workspace right now. Try reloading the page.
        </Text>
      </PageFrame>
    );
  }

  const projectResult = await getProject(id, workspaceResult.workspace.id);

  if (projectResult.status === "error") {
    notFound();
  }

  const { project } = projectResult;
  const isArchived = project.status === "archived";
  const sessionsResult = await listSessions(project.id, project.workspace_id);
  const artifactsResult = await listArtifacts(project.id, project.workspace_id);

  return (
    <PageFrame
      actions={<Link href="/workspace/projects">Back to projects</Link>}
      description={isArchived ? "This project is archived." : "This project is active."}
      eyebrow="Project"
      title={project.name}
    >
      <Stack gap={8}>
        <Card variant="inset">
          <Stack gap={4}>
            <Heading level={2} visualRole="heading-4">
              Description
            </Heading>
            <ProjectDescriptionForm project={project} />
          </Stack>
        </Card>

        <Card variant="inset">
          <Stack gap={4}>
            <Heading level={2} visualRole="heading-4">
              Context
            </Heading>
            <ProjectContextForm project={project} />
          </Stack>
        </Card>

        <Card variant="inset">
          <Stack gap={4}>
            <Heading level={2} visualRole="heading-4">
              Sessions
            </Heading>

            {sessionsResult.status === "error" ? (
              <Text color="secondary">We couldn&apos;t load sessions right now.</Text>
            ) : sessionsResult.sessions.length === 0 ? (
              <Text color="secondary">No sessions yet. Start one to begin working.</Text>
            ) : (
              <Stack gap={3}>
                {sessionsResult.sessions.map((session) => (
                  <SessionListItem key={session.id} projectId={project.id} session={session} />
                ))}
              </Stack>
            )}

            <StartSessionForm projectId={project.id} workspaceId={project.workspace_id} />
          </Stack>
        </Card>

        <Card variant="inset">
          <Stack gap={4}>
            <Heading level={2} visualRole="heading-4">
              Artifacts
            </Heading>

            {artifactsResult.status === "error" ? (
              <Text color="secondary">We couldn&apos;t load artifacts right now.</Text>
            ) : artifactsResult.artifacts.length === 0 ? (
              <Text color="secondary">
                No artifacts yet. Create one below, or save a session message as an artifact.
              </Text>
            ) : (
              <Stack gap={3}>
                {artifactsResult.artifacts.map((artifact) => (
                  <ArtifactListItem artifact={artifact} key={artifact.id} projectId={project.id} />
                ))}
              </Stack>
            )}

            <CreateArtifactForm projectId={project.id} workspaceId={project.workspace_id} />
          </Stack>
        </Card>

        <ProjectHomeActions isArchived={isArchived} projectId={project.id} />
      </Stack>
    </PageFrame>
  );
}
