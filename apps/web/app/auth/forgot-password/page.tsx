import type { Metadata } from "next";

import { FormMessage, Stack } from "@lushra/ui";

import { AuthFormShell } from "@/features/auth/auth-form-shell";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password"
};

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ForgotPasswordPage({
  searchParams
}: ForgotPasswordPageProps) {
  const { error } = await searchParams;

  return (
    <AuthFormShell
      description="Enter your email address and we'll send you recovery instructions."
      title="Reset your password"
    >
      <Stack gap={6}>
        {error ? (
          <FormMessage tone="error">
            That recovery link is invalid or has expired. Request a new one below.
          </FormMessage>
        ) : null}

        <ForgotPasswordForm />
      </Stack>
    </AuthFormShell>
  );
}
