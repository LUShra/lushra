import { Card, Heading, Stack, Text } from "@lushra/ui";

import { PageFrame } from "@/components/layout/page-frame";
import { getOrCreatePersonalWorkspace } from "@/features/workspace/get-or-create-personal-workspace";

export default async function WorkspaceOverviewPage() {
  const result = await getOrCreatePersonalWorkspace();
  const eyebrow = result.status === "ready" ? result.workspace.name : "Workspace";

  return (
    <PageFrame
      description="This is your workspace home. Once you create a project, its recent work, pending reviews, and next actions will surface here."
      eyebrow={eyebrow}
      title="Overview"
    >
      <Card variant="inset">
        <Stack gap={2}>
          <Heading level={2} visualRole="heading-4">
            Nothing to show yet
          </Heading>

          <Text color="secondary">
            Projects, activity, and reviews will appear here once your first project exists.
          </Text>
        </Stack>
      </Card>
    </PageFrame>
  );
}
