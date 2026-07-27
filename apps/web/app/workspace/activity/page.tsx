import { Card, Heading, Inline, Stack, Text } from "@lushra/ui";
import Link from "next/link";

import { PageFrame } from "@/components/layout/page-frame";
import { listWorkspaceActivity } from "@/features/activity/list-workspace-activity";
import { getOrCreatePersonalWorkspace } from "@/features/workspace/get-or-create-personal-workspace";

export default async function WorkspaceActivityPage() {
  const workspaceResult = await getOrCreatePersonalWorkspace();

  if (workspaceResult.status === "error") {
    return (
      <PageFrame eyebrow="Workspace" title="Activity">
        <Text color="secondary">
          We couldn&apos;t load your workspace right now. Try reloading the page.
        </Text>
      </PageFrame>
    );
  }

  const activityResult = await listWorkspaceActivity(workspaceResult.workspace.id);

  return (
    <PageFrame
      description="A record of what happened across your workspace, and when."
      eyebrow="Workspace"
      title="Activity"
    >
      {activityResult.status === "error" ? (
        <Card variant="inset">
          <Text color="secondary">We couldn&apos;t load recent activity right now.</Text>
        </Card>
      ) : activityResult.items.length === 0 ? (
        <Card variant="inset">
          <Stack gap={2}>
            <Heading level={2} visualRole="heading-4">
              No activity yet
            </Heading>

            <Text color="secondary">
              Real workspace events will appear here once there is activity to show.
            </Text>
          </Stack>
        </Card>
      ) : (
        <Stack gap={3}>
          {activityResult.items.map((item) => {
            const occurredAt = new Date(item.timestamp).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short"
            });

            return (
              <Card key={item.id} variant="raised">
                <Inline align="center" gap={4} justify="between" wrap>
                  <Stack gap={1}>
                    <Text color="secondary">{item.description}</Text>
                    <Link href={item.href}>{item.title}</Link>
                  </Stack>

                  <Stack align="end" gap={1}>
                    {item.projectName ? (
                      <Text color="secondary">{item.projectName}</Text>
                    ) : null}
                    <Text color="secondary">{occurredAt}</Text>
                  </Stack>
                </Inline>
              </Card>
            );
          })}
        </Stack>
      )}
    </PageFrame>
  );
}
