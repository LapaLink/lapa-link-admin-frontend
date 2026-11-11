import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Badge images go through a server action: up to 5 MB plus multipart overhead.
    serverActions: { bodySizeLimit: "6mb" },
  },
  // Chat STOMP socket, proxied like in lapa-link-frontend.
  async rewrites() {
    return [
      {
        source: "/ws",
        destination: `${process.env.BACKEND_URL ?? "http://localhost:8080"}/ws`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/admin/users/:userId",
        destination: "/admin/users/:userId/cases",
        permanent: false,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
