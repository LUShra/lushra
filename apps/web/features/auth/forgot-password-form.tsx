"use client";

import { useActionState } from "react";

import { Button, Field, FormMessage, Input, Label, Stack, Text } from "@lushra/ui";
import Link from "next/link";

import { requestPasswordResetAction, type AuthActionState } from "./auth-actions";

const initialState: AuthActionState = { status: "idle" };

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordResetAction,
    initialState
  );

  if (state.status === "success") {
    return (
      <Stack gap={4}>
        <FormMessage tone="success">{state.message}</FormMessage>
        <Text role="body-small">
          <Link href="/auth/sign-in">Return to sign in</Link>
        </Text>
      </Stack>
    );
  }

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate>
      <Stack gap={6}>
        <Field invalid={Boolean(fieldErrors.email)}>
          <Label>Email address</Label>
          <Input autoComplete="email" name="email" required type="email" />
          {fieldErrors.email ? (
            <FormMessage tone="error">{fieldErrors.email}</FormMessage>
          ) : null}
        </Field>

        <Button loading={isPending} type="submit">
          Send recovery instructions
        </Button>

        <Text role="body-small">
          <Link href="/auth/sign-in">Return to sign in</Link>
        </Text>
      </Stack>
    </form>
  );
}
