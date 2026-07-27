import { Card, Heading, Inline, Stack, Text } from "@lushra/ui";
import Link from "next/link";

import { PageFrame } from "@/components/layout/page-frame";
import { listProjects } from "@/features/projects/list-projects";
import { getOrCreatePersonalWorkspace } from "@/features/workspace/get-or-create-personal-workspace";
import { listPendingReviewArtifacts } from "@/features/workspace/list-pending-reviews";
import { listRecentSessions } from "@/features/workspace/list-recent-sessions";

export default async function WorkspaceOverviewPage() {
  const workspaceResult = await getOrCreatePersonalWorkspace();
  const eyebrow = workspaceResult.status === "ready" ? workspaceResult.workspace.name : "Workspace";

  if (workspaceResult.status === "error") {
    return (
      <PageFrame eyebrow={eyebrow} title="Overview">
        <Text color="secondary">
          We couldn&apos;t load your workspace right now. Try reloading the page.
        </Text>
      </PageFrame>
    );
  }

  const workspaceId = workspaceResult.workspace.id;

  const [projectsResult, pendingReviewsResult, recentSessionsResult] = await Promise.all([
    listProjects(workspaceId),
    listPendingReviewArtifacts(workspaceId),
    listRecentSessions(workspaceId)
  ]);

  const projectCount = projectsResult.status === "ready" ? projectsResult.projects.length : 0;

  return (
    <PageFrame
      description="Current projects, pending reviews, and recent sessions across your workspace."
      eyebrow={eyebrow}
      title="Overview"
    >
      <Stack gap={8}>
        <Card variant="inset">
          <Stack gap={2}>
            <Heading level={2} visualRole="heading-4">
              Projects
            </Heading>

            {projectCount > 0 ? (
              <Text color="secondary">
                <Link href="/workspace/projects">
                  {projectCount === 1 ? "1 project" : `${projectCount} projects`}
                </Link>
              </Text>
            ) : (
              <Text color="secondary">
                Nothing to show yet. Create your first project to begin.
              </Text>
            )}
          </Stack>
        </Card>

        <Card variant="inset">
          <Stack gap={4}>
            <Heading level={2} visualRole="heading-4">
              Pending review
            </Heading>

            {pendingReviewsResult.status === "error" ? (
              <Text color="secondary">We couldn&apos;t load pending reviews right now.</Text>
            ) : pendingReviewsResult.artifacts.length === 0 ? (
              <Text color="secondary">Nothing waiting on review right now.</Text>
            ) : (
              <Stack gap={3}>
                {pendingReviewsResult.artifacts.map((artifact) => (
                  <Card key={artifact.id} variant="raised">
                    <Inline align="center" gap={4} justify="between">
                      <Link href={`/workspace/projects/${artifact.project_id}/artifacts/${artifact.id}`}>
                        {artifact.title}
                      </Link>
                      <Text color="secondary">{artifact.projectName}</Text>
                    </Inline>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        </Card>

        <Card variant="inset">
          <Stack gap={4}>
            <Heading level={2} visualRole="heading-4">
              Recent sessions
            </Heading>

            {recentSessionsResult.status === "error" ? (
              <Text color="secondary">We couldn&apos;t load recent sessions right now.</Text>
            ) : recentSessionsResult.sessions.length === 0 ? (
              <Text color="secondary">No sessions yet. Start one from a project to begin.</Text>
            ) : (
              <Stack gap={3}>
                {recentSessionsResult.sessions.map((session) => {
                  const startedAt = new Date(session.created_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short"
                  });

                  return (
                    <Card key={session.id} variant="raised">
                      <Inline align="center" gap={4} justify="between">
                        <Link
                          href={`/workspace/projects/${session.project_id}/sessions/${session.id}`}
                        >
                          {session.projectName}
                        </Link>
                        <Text color="secondary">{startedAt}</Text>
                      </Inline>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </Card>
      </Stack>
    </PageFrame>
  );
}
