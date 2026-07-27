import { NextResponse, type NextRequest } from "next/server";

import { AUTH_EVENTS, logAuthEvent, normalizeAuthError } from "@/features/auth/auth-events";
import { getSafeRedirectPath } from "@/features/auth/redirects";
import { createClient } from "@/lib/supabase/server";

/**
 * Only the two OTP types this milestone actually issues (email
 * confirmation, password recovery) are accepted -- everything else
 * (invite, magiclink, email_change, OAuth) is out of scope and rejected
 * rather than silently forwarded to Supabase.
 */
type SupportedOtpType = "email" | "recovery";

function isSupportedOtpType(value: string | null): value is SupportedOtpType {
  return value === "email" || value === "recovery";
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = getSafeRedirectPath(searchParams.get("next"));
  const correlationId = request.headers.get("x-vercel-id") ?? undefined;

  if (!tokenHash || !isSupportedOtpType(type)) {
    logAuthEvent("warn", AUTH_EVENTS.confirmationInvalidRequest, {
      correlationId,
      route: "/auth/confirm",
      otpType: type ?? undefined
    });
    return NextResponse.redirect(
      new URL("/auth/sign-in?error=invalid_confirmation_link", origin)
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    logAuthEvent("warn", AUTH_EVENTS.confirmationFailed, {
      correlationId,
      route: "/auth/confirm",
      otpType: type,
      ...normalizeAuthError(error)
    });
    const fallback = type === "recovery" ? "/auth/forgot-password" : "/auth/sign-in";
    return NextResponse.redirect(new URL(`${fallback}?error=confirmation_failed`, origin));
  }

  logAuthEvent("info", AUTH_EVENTS.confirmationSucceeded, {
    correlationId,
    route: "/auth/confirm",
    otpType: type,
    userId: data.user?.id
  });

  return NextResponse.redirect(new URL(next, origin));
}
