import { Card, Heading, Stack, Text } from "@lushra/ui";

import { PageFrame } from "@/components/layout/page-frame";

export default function WorkspaceProjectsPage() {
  return (
    <PageFrame
      description="Projects are the durable containers for your work."
      eyebrow="Workspace"
      title="Projects"
    >
      <Card variant="inset">
        <Stack gap={2}>
          <Heading level={2} visualRole="heading-4">
            No projects yet
          </Heading>

          <Text color="secondary">
            Project creation is not available yet. Your projects will appear here once this
            capability ships.
          </Text>
        </Stack>
      </Card>
    </PageFrame>
  );
}
