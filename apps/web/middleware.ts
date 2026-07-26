import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_REDIRECT_PATH } from "@/features/auth/redirects";
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
function redirectPreservingCookies(response: NextResponse, destination: URL): NextResponse {
  const redirectResponse = NextResponse.redirect(destination);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (isWorkspacePath(pathname) && !user) {
    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("next", `${pathname}${search}`);
    return redirectPreservingCookies(response, signInUrl);
  }

  if (user && SIGNED_OUT_ONLY_PATHS.includes(pathname)) {
    return redirectPreservingCookies(response, new URL(DEFAULT_REDIRECT_PATH, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
