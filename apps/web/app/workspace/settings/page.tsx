import { Card, Heading, Stack, Text } from "@lushra/ui";

import { PageFrame } from "@/components/layout/page-frame";

export default function WorkspaceSettingsPage() {
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
      </Stack>
    </PageFrame>
  );
}
