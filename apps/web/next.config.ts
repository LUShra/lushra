import type { NextConfig } from "next";

/**
 * Standard, low-risk hardening headers, applied statically to every
 * response. The Content-Security-Policy lives in middleware.ts instead
 * of here -- it embeds a fresh per-request nonce, which a static
 * `headers()` config here has no way to generate.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  }
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@lushra/ui"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/workspace",
        permanent: true
      },
      {
        source: "/dashboard/projects",
        destination: "/workspace/projects",
        permanent: true
      },
      {
        source: "/dashboard/activity",
        destination: "/workspace/activity",
        permanent: true
      },
      {
        source: "/dashboard/settings",
        destination: "/workspace/settings",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
