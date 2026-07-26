import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthFormShell } from "@/features/auth/auth-form-shell";
import { UpdatePasswordForm } from "@/features/auth/update-password-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Update your password"
};

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/forgot-password");
  }

  return (
    <AuthFormShell description="Choose a new password for your account." title="Update your password">
      <UpdatePasswordForm />
    </AuthFormShell>
  );
}
