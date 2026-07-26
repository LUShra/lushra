"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { getAppOrigin, getSafeRedirectPath } from "./redirects";

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
};

function normalizeEmail(value: FormDataEntryValue | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!email) {
    return { status: "error", fieldErrors: { email: "Enter your email address." } };
  }

  if (!password) {
    return { status: "error", fieldErrors: { password: "Enter a password." } };
  }

  if (password !== confirmPassword) {
    return {
      status: "error",
      fieldErrors: { confirmPassword: "Passwords do not match." }
    };
  }

  const origin = await getAppOrigin();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?type=email&next=${encodeURIComponent(
        "/workspace"
      )}`
    }
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  if (data.session) {
    redirect("/workspace");
  }

  return {
    status: "success",
    message: "Check your email to confirm your account before signing in."
  };
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const next = getSafeRedirectPath(String(formData.get("next") ?? ""));

  if (!email) {
    return { status: "error", fieldErrors: { email: "Enter your email address." } };
  }

  if (!password) {
    return { status: "error", fieldErrors: { password: "Enter your password." } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { status: "error", message: error.message };
  }

  redirect(next);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/sign-in");
}

export async function requestPasswordResetAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = normalizeEmail(formData.get("email"));

  if (!email) {
    return { status: "error", fieldErrors: { email: "Enter your email address." } };
  }

  const origin = await getAppOrigin();
  const supabase = await createClient();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?type=recovery&next=${encodeURIComponent(
      "/auth/update-password"
    )}`
  });

  return {
    status: "success",
    message: "If an account matches that email, recovery instructions will be sent."
  };
}

export async function updatePasswordAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password) {
    return { status: "error", fieldErrors: { password: "Enter a new password." } };
  }

  if (password !== confirmPassword) {
    return {
      status: "error",
      fieldErrors: { confirmPassword: "Passwords do not match." }
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Your password reset link has expired. Request a new one."
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { status: "error", message: error.message };
  }

  redirect("/workspace");
}
