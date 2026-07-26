import type { Metadata } from "next";

import { AuthFormShell } from "@/features/auth/auth-form-shell";
import { SignUpForm } from "@/features/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create your account"
};

export default function SignUpPage() {
  return (
    <AuthFormShell description="Create your secure Lushra workspace." title="Create your account">
      <SignUpForm />
    </AuthFormShell>
  );
}
