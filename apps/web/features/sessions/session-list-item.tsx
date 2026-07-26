import { Card, Inline, Text } from "@lushra/ui";
import Link from "next/link";

import type { Session } from "./list-sessions";

export type SessionListItemProps = {
  projectId: string;
  session: Session;
};

export function SessionListItem({ projectId, session }: SessionListItemProps) {
  const startedAt = new Date(session.created_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
    <Card variant="raised">
      <Inline align="center" gap={4} justify="between">
        <Link href={`/workspace/projects/${projectId}/sessions/${session.id}`}>
          Session started {startedAt}
        </Link>
        <Text color="secondary">Open</Text>
      </Inline>
    </Card>
  );
}
