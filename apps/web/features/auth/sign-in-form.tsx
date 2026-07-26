"use client";

import { useActionState } from "react";

import { Button, Field, FormMessage, Input, Label, Stack, Text } from "@lushra/ui";
import Link from "next/link";

import { signInAction, type AuthActionState } from "./auth-actions";

const initialState: AuthActionState = { status: "idle" };

export type SignInFormProps = {
  next?: string;
};

export function SignInForm({ next }: SignInFormProps) {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate>
      <Stack gap={6}>
        <input name="next" type="hidden" value={next ?? ""} />

        <Field invalid={Boolean(fieldErrors.email)}>
          <Label>Email address</Label>
          <Input autoComplete="email" name="email" required type="email" />
          {fieldErrors.email ? (
            <FormMessage tone="error">{fieldErrors.email}</FormMessage>
          ) : null}
        </Field>

        <Field invalid={Boolean(fieldErrors.password)}>
          <Label>Password</Label>
          <Input autoComplete="current-password" name="password" required type="password" />
          {fieldErrors.password ? (
            <FormMessage tone="error">{fieldErrors.password}</FormMessage>
          ) : null}
        </Field>

        {state.status === "error" && state.message ? (
          <FormMessage tone="error">{state.message}</FormMessage>
        ) : null}

        <Button loading={isPending} type="submit">
          Sign in
        </Button>

        <Stack gap={2}>
          <Text role="body-small">
            <Link href="/auth/forgot-password">Forgot your password?</Link>
          </Text>
          <Text role="body-small">
            New to Lushra? <Link href="/auth/sign-up">Create an account</Link>
          </Text>
        </Stack>
      </Stack>
    </form>
  );
}
