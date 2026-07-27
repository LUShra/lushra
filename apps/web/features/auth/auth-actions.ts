"use server";

import { redirect } from "next/navigation";

import { getClientIp } from "@/lib/client-ip";
import { getCorrelationId } from "@/lib/correlation";
import {
  buildRateLimitKey,
  checkRateLimit,
  describeRetryAfter,
  type RateLimitResult
} from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

import { AUTH_EVENTS, logAuthEvent, normalizeAuthError } from "./auth-events";
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

/**
 * Checks both an IP-scoped and an email-scoped bucket for the same
 * action and reports whichever is more restrictive -- this catches both
 * one source hammering many accounts and many sources hammering one
 * account. Server-authoritative (Postgres-backed, see @/lib/rate-limit),
 * never a client-enforced or in-memory check.
 */
async function checkAuthRateLimit(
  action: string,
  email: string,
  ipMax: number,
  emailMax: number,
  windowSeconds: number,
  correlationId: string | undefined
): Promise<{ limited: true; message: string } | { limited: false }> {
  const ip = await getClientIp();

  const [ipResult, emailResult] = await Promise.all([
    checkRateLimit(buildRateLimitKey(action, "ip", ip), ipMax, windowSeconds, correlationId),
    checkRateLimit(buildRateLimitKey(action, "email", email), emailMax, windowSeconds, correlationId)
  ]);

  const blocked: RateLimitResult | undefined = [ipResult, emailResult].find(
    (result) => !result.allowed
  );

  if (blocked && !blocked.allowed) {
    return {
      limited: true,
      message: `Too many attempts. Try again ${describeRetryAfter(blocked.retryAfterSeconds)}.`
    };
  }

  return { limited: false };
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const correlationId = await getCorrelationId();

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

  // 5 sign-ups per hour per IP, 3 per hour per email -- generous enough
  // for genuine retries (a typo'd password confirmation, a slow email
  // client) while bounding mass account creation.
  const rateLimit = await checkAuthRateLimit("sign_up", email, 5, 3, 60 * 60, correlationId);

  if (rateLimit.limited) {
    return { status: "error", message: rateLimit.message };
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
    logAuthEvent("warn", AUTH_EVENTS.signUpFailed, {
      correlationId,
      email,
      ...normalizeAuthError(error)
    });
    return { status: "error", message: error.message };
  }

  logAuthEvent("info", AUTH_EVENTS.signUpSucceeded, {
    correlationId,
    email,
    userId: data.user?.id
  });

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
  const correlationId = await getCorrelationId();

  if (!email) {
    return { status: "error", fieldErrors: { email: "Enter your email address." } };
  }

  if (!password) {
    return { status: "error", fieldErrors: { password: "Enter your password." } };
  }

  // 20 attempts per 5 minutes per IP (lenient -- shared NATs/offices),
  // 5 per 5 minutes per email (the actual brute-force guard).
  const rateLimit = await checkAuthRateLimit("sign_in", email, 20, 5, 5 * 60, correlationId);

  if (rateLimit.limited) {
    return { status: "error", message: rateLimit.message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    logAuthEvent("warn", AUTH_EVENTS.signInFailed, {
      correlationId,
      email,
      ...normalizeAuthError(error)
    });
    return { status: "error", message: error.message };
  }

  logAuthEvent("info", AUTH_EVENTS.signInSucceeded, {
    correlationId,
    email,
    userId: data.user.id
  });

  redirect(next);
}

export async function signOutAction(): Promise<void> {
  const correlationId = await getCorrelationId();
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  await supabase.auth.signOut();
  logAuthEvent("info", AUTH_EVENTS.signedOut, { correlationId, userId: user?.id });

  redirect("/auth/sign-in");
}

export async function requestPasswordResetAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = normalizeEmail(formData.get("email"));
  const correlationId = await getCorrelationId();

  if (!email) {
    return { status: "error", fieldErrors: { email: "Enter your email address." } };
  }

  // 5 requests per hour per IP, 3 per hour per email -- recovery email
  // is cheap to trigger but must stay bounded (repeated requests would
  // otherwise be a way to spam a victim's inbox).
  const rateLimit = await checkAuthRateLimit(
    "password_recovery",
    email,
    5,
    3,
    60 * 60,
    correlationId
  );

  if (rateLimit.limited) {
    // Deliberately still the same generic shape as every other response
    // from this action (see below) -- a rate-limit message reveals only
    // that *this IP or email* is sending too many requests, never
    // whether the specific email has an account.
    return { status: "error", message: rateLimit.message };
  }

  const origin = await getAppOrigin();
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?type=recovery&next=${encodeURIComponent(
      "/auth/update-password"
    )}`
  });

  // The user-facing response is deliberately identical whether this
  // succeeded or failed (Milestone 24: anti-enumeration -- never reveal
  // whether a given email has an account). The failure is still logged
  // server-side, since the team genuinely needs to know if this call is
  // failing (misconfiguration, provider outage, rate limit) even though
  // the user can't be told without leaking account existence.
  if (error) {
    logAuthEvent("warn", AUTH_EVENTS.passwordRecoveryFailed, {
      correlationId,
      email,
      ...normalizeAuthError(error)
    });
  } else {
    logAuthEvent("info", AUTH_EVENTS.passwordRecoveryRequested, { correlationId, email });
  }

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
  const correlationId = await getCorrelationId();

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
    logAuthEvent("warn", AUTH_EVENTS.passwordUpdateFailed, {
      correlationId,
      errorCode: "session_expired"
    });
    return {
      status: "error",
      message: "Your password reset link has expired. Request a new one."
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    logAuthEvent("warn", AUTH_EVENTS.passwordUpdateFailed, {
      correlationId,
      userId: user.id,
      ...normalizeAuthError(error)
    });
    return { status: "error", message: error.message };
  }

  logAuthEvent("info", AUTH_EVENTS.passwordUpdateSucceeded, { correlationId, userId: user.id });

  redirect("/workspace");
}
