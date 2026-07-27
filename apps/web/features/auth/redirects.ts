export const DEFAULT_REDIRECT_PATH = "/workspace";

const INTERNAL_BASE = "http://internal.invalid";

/**
 * Only an internal absolute path may be returned. Resolving the candidate
 * against a fixed, unreachable base and comparing origins catches every
 * open-redirect trick (protocol-relative //, backslash-as-slash, an
 * embedded scheme like javascript:) in one place, rather than pattern
 * matching each trick individually.
 */
export function getSafeRedirectPath(candidate: string | null | undefined): string {
  if (!candidate) {
    return DEFAULT_REDIRECT_PATH;
  }

  try {
    const resolved = new URL(candidate, INTERNAL_BASE);

    if (resolved.origin !== INTERNAL_BASE) {
      return DEFAULT_REDIRECT_PATH;
    }

    if (!resolved.pathname.startsWith("/") || resolved.pathname.startsWith("//")) {
      return DEFAULT_REDIRECT_PATH;
    }

    if (resolved.pathname.startsWith("/auth")) {
      return DEFAULT_REDIRECT_PATH;
    }

    return `${resolved.pathname}${resolved.search}`;
  } catch {
    return DEFAULT_REDIRECT_PATH;
  }
}

/**
 * NEXT_PUBLIC_APP_URL is the canonical override; VERCEL_URL covers every
 * deployed environment (Vercel injects it for production and every
 * preview, each with its own unique host), so this is reached in practice
 * only for local dev without an .env.local present.
 *
 * Deliberately does NOT fall back to the request's own Host header: that
 * header is attacker-controllable on any request reaching a public
 * endpoint, and this value feeds directly into `emailRedirectTo`/
 * `redirectTo` URLs sent in sign-up confirmation and password-reset
 * emails -- trusting it would be a host-header injection / password-reset
 * link poisoning vector. A fixed localhost fallback covers local dev
 * instead, matching this file's own default redirect path.
 */
export async function getAppOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL;

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL;

  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
}
