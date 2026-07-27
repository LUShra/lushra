import { Card, Heading, Stack, Text } from "@lushra/ui";

import { PageFrame } from "@/components/layout/page-frame";
import { getWorkspaceUsage } from "@/features/billing/get-workspace-usage";
import { getOrCreatePersonalWorkspace } from "@/features/workspace/get-or-create-personal-workspace";

export default async function WorkspaceSettingsPage() {
  const workspaceResult = await getOrCreatePersonalWorkspace();

  if (workspaceResult.status === "error") {
    return (
      <PageFrame eyebrow="Workspace" title="Settings">
        <Text color="secondary">
          We couldn&apos;t load your workspace right now. Try reloading the page.
        </Text>
      </PageFrame>
    );
  }

  const usageResult = await getWorkspaceUsage(workspaceResult.workspace.id);

  return (
    <PageFrame description="Account and workspace configuration." eyebrow="Workspace" title="Settings">
      <Stack gap={4}>
        <Card variant="inset">
          <Stack gap={2}>
            <Heading level={2} visualRole="heading-4">
              Account
            </Heading>

            <Text color="secondary">Account settings are not configured yet.</Text>
          </Stack>
        </Card>

        <Card variant="inset">
          <Stack gap={2}>
            <Heading level={2} visualRole="heading-4">
              Workspace
            </Heading>

            <Text color="secondary">Workspace settings are not configured yet.</Text>
          </Stack>
        </Card>

        <Card variant="inset">
          <Stack gap={4}>
            <Heading level={2} visualRole="heading-4">
              Plan &amp; usage
            </Heading>

            <Stack gap={1}>
              <Text color="secondary">Current access level</Text>
              <Text>Personal workspace. No paid plans exist yet.</Text>
            </Stack>

            {usageResult.status === "error" ? (
              <Text color="secondary">We couldn&apos;t load usage information right now.</Text>
            ) : (
              <Stack gap={1}>
                <Text color="secondary">Usage</Text>
                <Text>
                  {usageResult.usage.projectCount}{" "}
                  {usageResult.usage.projectCount === 1 ? "project" : "projects"},{" "}
                  {usageResult.usage.sessionCount}{" "}
                  {usageResult.usage.sessionCount === 1 ? "session" : "sessions"},{" "}
                  {usageResult.usage.artifactCount}{" "}
                  {usageResult.usage.artifactCount === 1 ? "artifact" : "artifacts"},{" "}
                  {usageResult.usage.sourceCount}{" "}
                  {usageResult.usage.sourceCount === 1 ? "source" : "sources"}
                </Text>
              </Stack>
            )}

            <Text color="secondary">No usage limits are currently enforced.</Text>
          </Stack>
        </Card>
      </Stack>
    </PageFrame>
  );
}
