"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!fullName || !email || !password) {
      setError("Complete every field.");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setSuccess(
        "Account created. Check your email and confirm your address before signing in.",
      );

      event.currentTarget.reset();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create your account. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div>
          <p className="eyebrow">Join Lushra</p>
          <h1 className="auth-title">Create your account</h1>

          <p className="auth-description">
            Create your secure Lushra workspace.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Full name</span>

            <input
              autoComplete="name"
              name="fullName"
              placeholder="Your full name"
              required
              type="text"
            />
          </label>

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
              autoComplete="new-password"
              minLength={8}
              name="password"
              placeholder="At least 8 characters"
              required
              type="password"
            />
          </label>

          {error ? (
            <p role="alert">{error}</p>
          ) : null}

          {success ? (
            <p role="status">{success}</p>
          ) : null}

          <button
            className="button button--primary"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already registered?{" "}
          <Link href="/auth/sign-in">Sign in</Link>
        </p>

        <Link className="back-link" href="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
