import { Card, Heading, Stack, Text } from "@lushra/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageFrame } from "@/components/layout/page-frame";
import { SaveAsArtifactButton } from "@/features/artifacts/save-as-artifact-button";
import { getProject } from "@/features/projects/list-projects";
import { listMessages } from "@/features/sessions/list-messages";
import { getSession } from "@/features/sessions/list-sessions";
import { SendMessageForm } from "@/features/sessions/send-message-form";
import { getOrCreatePersonalWorkspace } from "@/features/workspace/get-or-create-personal-workspace";

import styles from "./session-page.module.css";

type SessionPageProps = {
  params: Promise<{ id: string; sessionId: string }>;
};

export default async function SessionPage({ params }: SessionPageProps) {
  const { id: projectId, sessionId } = await params;
  const workspaceResult = await getOrCreatePersonalWorkspace();

  if (workspaceResult.status === "error") {
    return (
      <PageFrame eyebrow="Session" title="Session">
        <Text color="secondary">
          We couldn&apos;t load your workspace right now. Try reloading the page.
        </Text>
      </PageFrame>
    );
  }

  const workspaceId = workspaceResult.workspace.id;

  const projectResult = await getProject(projectId, workspaceId);

  if (projectResult.status === "error") {
    notFound();
  }

  const sessionResult = await getSession(sessionId, projectId, workspaceId);

  if (sessionResult.status === "error") {
    notFound();
  }

  const { project } = projectResult;
  const { session } = sessionResult;

  const messagesResult = await listMessages(session.id, workspaceId);

  const startedAt = new Date(session.created_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
    <PageFrame
      actions={<Link href={`/workspace/projects/${project.id}`}>Back to {project.name}</Link>}
      description={`Started ${startedAt}`}
      eyebrow="Session"
      title="Session"
    >
      <Stack gap={6}>
        <Card variant="inset">
          <Stack gap={4}>
            <Heading level={2} visualRole="heading-4">
              Messages
            </Heading>

            {messagesResult.status === "error" ? (
              <Text color="secondary">We couldn&apos;t load messages right now.</Text>
            ) : messagesResult.messages.length === 0 ? (
              <Text color="secondary">No messages yet. Send the first one below.</Text>
            ) : (
              <Stack gap={4}>
                {messagesResult.messages.map((message) => {
                  const sentAt = new Date(message.created_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short"
                  });
                  const senderLabel = message.role === "assistant" ? "AI assistant" : "You";

                  return (
                    <Stack gap={1} key={message.id}>
                      {/* eslint-disable-next-line jsx-a11y/aria-role -- Text's `role` is a typography role, not an ARIA role. */}
                      <Text color="secondary" role="label">
                        {senderLabel} · {sentAt}
                      </Text>
                      <Text className={styles.messageContent}>{message.content}</Text>
                      <SaveAsArtifactButton
                        content={message.content}
                        projectId={project.id}
                        workspaceId={workspaceId}
                      />
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </Card>

        <SendMessageForm projectId={project.id} sessionId={session.id} workspaceId={workspaceId} />
      </Stack>
    </PageFrame>
  );
}
