"use client";

import { useActionState } from "react";

import { Button, Field, FormMessage, Input, Label, Stack } from "@lushra/ui";

import { updatePasswordAction, type AuthActionState } from "./auth-actions";

const initialState: AuthActionState = { status: "idle" };

export function UpdatePasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePasswordAction, initialState);
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate>
      <Stack gap={6}>
        <Field invalid={Boolean(fieldErrors.password)}>
          <Label>New password</Label>
          <Input autoComplete="new-password" minLength={8} name="password" required type="password" />
          {fieldErrors.password ? (
            <FormMessage tone="error">{fieldErrors.password}</FormMessage>
          ) : null}
        </Field>

        <Field invalid={Boolean(fieldErrors.confirmPassword)}>
          <Label>Confirm new password</Label>
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
          Update password
        </Button>
      </Stack>
    </form>
  );
}
