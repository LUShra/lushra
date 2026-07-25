import { Card, Heading, Stack, Text } from "@lushra/ui";

import { PageFrame } from "@/components/layout/page-frame";

export default function WorkspaceActivityPage() {
  return (
    <PageFrame
      description="Activity is a record of what happened across your workspace, and when."
      eyebrow="Workspace"
      title="Activity"
    >
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
    </PageFrame>
  );
}
