import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@lushra/ui"],
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
