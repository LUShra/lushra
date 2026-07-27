import { NextResponse, type NextRequest } from "next/server";

import { AUTH_EVENTS } from "@/features/auth/auth-events";
import { DEFAULT_REDIRECT_PATH } from "@/features/auth/redirects";
import { buildContentSecurityPolicy, generateNonce } from "@/lib/csp";
import { logEvent } from "@/lib/log";
import { updateSession } from "@/lib/supabase/middleware";

const SIGNED_OUT_ONLY_PATHS = ["/auth/sign-in", "/auth/sign-up"];

function isWorkspacePath(pathname: string): boolean {
  return pathname === "/workspace" || pathname.startsWith("/workspace/");
}

/**
 * NextResponse.redirect() builds a fresh response, so cookies refreshed by
 * updateSession() have to be copied across explicitly or the session
 * refresh that just happened is silently dropped on every redirect.
 */
function redirectPreservingCookies(
  response: NextResponse,
  destination: URL,
  csp: string
): NextResponse {
  const redirectResponse = NextResponse.redirect(destination);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  redirectResponse.headers.set("Content-Security-Policy", csp);

  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  // Set on the request *before* updateSession() so its internal
  // NextResponse.next({ request }) calls carry it through as a request
  // header -- that's how Next's own renderer discovers the nonce and
  // applies it to the inline scripts it injects for hydration.
  const nonce = generateNonce();
  const csp = buildContentSecurityPolicy(nonce, process.env.NODE_ENV === "development");
  request.headers.set("Content-Security-Policy", csp);

  const { response, user } = await updateSession(request);
  response.headers.set("Content-Security-Policy", csp);

  const { pathname, search } = request.nextUrl;

  if (isWorkspacePath(pathname) && !user) {
    // Expected to be this codebase's highest-volume auth event (any
    // logged-out visit to a bookmarked/shared workspace URL triggers it),
    // so it's deliberately lightweight -- no email, no user id (there is
    // none yet), just the path. Kept at "warn" rather than "error" since
    // this is a normal, expected outcome, not a failure.
    logEvent("warn", AUTH_EVENTS.protectedRouteDenied, {
      route: pathname,
      correlationId: request.headers.get("x-vercel-id") ?? undefined
    });

    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("next", `${pathname}${search}`);
    return redirectPreservingCookies(response, signInUrl, csp);
  }

  if (user && SIGNED_OUT_ONLY_PATHS.includes(pathname)) {
    return redirectPreservingCookies(
      response,
      new URL(DEFAULT_REDIRECT_PATH, request.url),
      csp
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
