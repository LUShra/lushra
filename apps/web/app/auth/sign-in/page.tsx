import type { Metadata } from "next";

import { FormMessage, Stack } from "@lushra/ui";

import { AuthFormShell } from "@/features/auth/auth-form-shell";
import { SignInForm } from "@/features/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in"
};

type SignInPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { next, error } = await searchParams;

  return (
    <AuthFormShell description="Access your Lushra workspace securely." title="Sign in to Lushra">
      <Stack gap={6}>
        {error ? (
          <FormMessage tone="error">
            That confirmation link is invalid or has expired. Request a new one below.
          </FormMessage>
        ) : null}

        <SignInForm next={next} />
      </Stack>
    </AuthFormShell>
  );
}
