import type { NextConfig } from "next";

/**
 * Standard, low-risk hardening headers only -- none of these change how
 * any page renders or behaves, unlike a Content-Security-Policy, which
 * this app does not yet ship: getting one wrong (blocking Next's own
 * hydration script, a font, or an image) is a real regression risk that
 * needs testing in a real browser this environment can't do. That stays
 * a follow-up, done deliberately rather than shipped blind.
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
