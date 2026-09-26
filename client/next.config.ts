import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

/**
 * OAuth lives at `/auth/*` on the Express server, not under `/api`. It can only be
 * proxied from Next when the API points at an absolute origin. With the relative
 * deployment value (`/api`) the origin is empty, so a rewrite here would point at
 * itself; `vercel.json` already forwards `/auth/*` to the serverless handler there.
 */
const HAS_ABSOLUTE_API = /^https?:\/\//i.test(API_URL) && API_ORIGIN.length > 0;

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : 'standalone',
  // Pin the workspace root to this app. Without this, a stray lockfile in a parent
  // directory makes Next infer a higher root, which nests the standalone output
  // under a prefixed path and breaks the Docker `node server.js` entrypoint.
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    const rewrites: { source: string; destination: string }[] = [
      {
        source: '/api/:path*',
        destination: `${API_URL}/:path*`,
      },
    ];

    if (HAS_ABSOLUTE_API) {
      rewrites.push({
        source: '/auth/:path*',
        destination: `${API_ORIGIN}/auth/:path*`,
      });
    }

    return rewrites;
  },
};

export default nextConfig;
