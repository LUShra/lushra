"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button, Field, FormMessage, Label, Stack, Textarea } from "@lushra/ui";

import { sendMessageAction, type SessionActionState } from "./session-actions";

const initialState: SessionActionState = { status: "idle" };

export type SendMessageFormProps = {
  sessionId: string;
  projectId: string;
  workspaceId: string;
};

export function SendMessageForm({ sessionId, projectId, workspaceId }: SendMessageFormProps) {
  const [state, formAction, isPending] = useActionState(sendMessageAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "idle") {
      formRef.current?.reset();
    }
  }, [state]);

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate ref={formRef}>
      <Stack gap={4}>
        <input name="sessionId" type="hidden" value={sessionId} />
        <input name="projectId" type="hidden" value={projectId} />
        <input name="workspaceId" type="hidden" value={workspaceId} />

        <Field invalid={Boolean(fieldErrors.content)}>
          <Label>Message</Label>
          <Textarea
            maxLength={10000}
            name="content"
            placeholder="Write a message..."
            rows={4}
          />
          {fieldErrors.content ? <FormMessage tone="error">{fieldErrors.content}</FormMessage> : null}
        </Field>

        {state.status === "error" && state.message ? (
          <FormMessage tone="error">{state.message}</FormMessage>
        ) : null}

        {state.status === "idle" && state.aiWarning ? (
          <FormMessage tone="warning">{state.aiWarning}</FormMessage>
        ) : null}

        <Button loading={isPending} size="small" type="submit">
          Send message
        </Button>
      </Stack>
    </form>
  );
}
