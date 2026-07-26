import { Card, Heading, Stack, Text } from "@lushra/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageFrame } from "@/components/layout/page-frame";
import { getProject } from "@/features/projects/list-projects";
import { ProjectContextForm } from "@/features/projects/project-context-form";
import { ProjectDescriptionForm } from "@/features/projects/project-description-form";
import { ProjectHomeActions } from "@/features/projects/project-home-actions";
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
          <Stack gap={2}>
            <Heading level={2} visualRole="heading-4">
              Sessions, artifacts, and review
            </Heading>
            <Text color="secondary">
              Not available yet. Once creation sessions ship, this project&apos;s recent work,
              pending review, and next actions will appear here.
            </Text>
          </Stack>
        </Card>

        <ProjectHomeActions isArchived={isArchived} projectId={project.id} />
      </Stack>
    </PageFrame>
  );
}
