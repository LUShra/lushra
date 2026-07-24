"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Enter your email address and password.");
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = createClient();

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1 className="auth-title">Sign in to Lushra</h1>

          <p className="auth-description">
            Access your Lushra workspace securely.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Email address</span>

            <input
              autoComplete="email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </label>

          <label className="form-field">
            <span>Password</span>

            <input
              autoComplete="current-password"
              name="password"
              placeholder="Enter your password"
              required
              type="password"
            />
          </label>

          {error ? (
            <p role="alert">{error}</p>
          ) : null}

          <button
            className="button button--primary"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          New to Lushra?{" "}
          <Link href="/auth/sign-up">Create an account</Link>
        </p>

        <Link className="back-link" href="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
