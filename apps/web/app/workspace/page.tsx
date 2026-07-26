import { Card, Heading, Stack, Text } from "@lushra/ui";
import Link from "next/link";

import { PageFrame } from "@/components/layout/page-frame";
import { listProjects } from "@/features/projects/list-projects";
import { getOrCreatePersonalWorkspace } from "@/features/workspace/get-or-create-personal-workspace";

export default async function WorkspaceOverviewPage() {
  const workspaceResult = await getOrCreatePersonalWorkspace();
  const eyebrow = workspaceResult.status === "ready" ? workspaceResult.workspace.name : "Workspace";

  const projectsResult =
    workspaceResult.status === "ready" ? await listProjects(workspaceResult.workspace.id) : null;
  const projectCount = projectsResult?.status === "ready" ? projectsResult.projects.length : 0;

  return (
    <PageFrame
      description="This is your workspace home. Once you create a project, its recent work, pending reviews, and next actions will surface here."
      eyebrow={eyebrow}
      title="Overview"
    >
      <Card variant="inset">
        <Stack gap={2}>
          {projectCount > 0 ? (
            <>
              <Heading level={2} visualRole="heading-4">
                {projectCount === 1 ? "1 project" : `${projectCount} projects`}
              </Heading>

              <Text color="secondary">
                <Link href="/workspace/projects">View your projects</Link>
              </Text>
            </>
          ) : (
            <>
              <Heading level={2} visualRole="heading-4">
                Nothing to show yet
              </Heading>

              <Text color="secondary">
                Projects, activity, and reviews will appear here once your first project exists.
              </Text>
            </>
          )}
        </Stack>
      </Card>
    </PageFrame>
  );
}
