/**
 * Pure CSP string-building, kept dependency-free (only Web-standard
 * `crypto`/`btoa`, available in both the Node and Edge middleware
 * runtimes -- no `Buffer`, which Edge does not reliably provide) so this
 * is directly unit-testable and so `middleware.ts` stays focused on
 * wiring rather than policy content.
 *
 * No external script/style/font/image host is needed anywhere in this
 * app: no next/font, no next/image, no <img>, no inline `style={{}}`,
 * no third-party <script>, and every Supabase/OpenAI call is
 * server-side only (verified by repo-wide search before writing this
 * policy) -- so every directive below can stay 'self'-scoped rather
 * than reaching for a wildcard.
 */
export function generateNonce(): string {
  return btoa(crypto.randomUUID());
}

export function buildContentSecurityPolicy(nonce: string, isDev: boolean): string {
  const directives = [
    "default-src 'self'",
    // 'strict-dynamic' (supported by every browser that also supports
    // nonces) makes the plain 'nonce-...' source the effective policy;
    // 'unsafe-eval' is added in dev only, for Next's Fast Refresh/HMR,
    // and never reaches a preview or production build.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // No CSS-in-JS or next/font in this app, but Next's own
    // framework-injected styles are not nonce-able the way scripts are;
    // kept as the one deliberate exception, matching Next's own
    // documented CSP guidance.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];

  return directives.join("; ");
}
