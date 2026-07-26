"use client";

import { useActionState } from "react";

import { Button, Field, FormMessage, Input, Label, Stack, Text } from "@lushra/ui";
import Link from "next/link";

import { signUpAction, type AuthActionState } from "./auth-actions";

const initialState: AuthActionState = { status: "idle" };

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);

  if (state.status === "success") {
    return (
      <Stack gap={4}>
        <FormMessage tone="success">{state.message}</FormMessage>
        <Text>
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

        <Field invalid={Boolean(fieldErrors.password)}>
          <Label>Password</Label>
          <Input
            autoComplete="new-password"
            minLength={8}
            name="password"
            required
            type="password"
          />
          {fieldErrors.password ? (
            <FormMessage tone="error">{fieldErrors.password}</FormMessage>
          ) : null}
        </Field>

        <Field invalid={Boolean(fieldErrors.confirmPassword)}>
          <Label>Confirm password</Label>
          <Input
            autoComplete="new-password"
            minLength={8}
            name="confirmPassword"
            required
            type="password"
          />
          {fieldErrors.confirmPassword ? (
            <FormMessage tone="error">{fieldErrors.confirmPassword}</FormMessage>
          ) : null}
        </Field>

        {state.status === "error" && state.message ? (
          <FormMessage tone="error">{state.message}</FormMessage>
        ) : null}

        <Button loading={isPending} type="submit">
          Create account
        </Button>

        <Text>
          Already registered? <Link href="/auth/sign-in">Sign in</Link>
        </Text>
      </Stack>
    </form>
  );
}
