import { headers } from "next/headers";

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
 * NEXT_PUBLIC_APP_URL is the canonical override; VERCEL_URL covers preview
 * deployments (each gets a unique host); the request's own Host header is
 * the last resort for local development without an .env.local present.
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

  const headerList = await headers();
  const host = headerList.get("host");

  if (host) {
    const protocol = host.startsWith("localhost") ? "http" : "https";
    return `${protocol}://${host}`;
  }

  return "http://localhost:3000";
}
