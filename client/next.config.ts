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
    const rewrites: { source: string; destination: string }[] = [];

    // `/api` is the same-origin deployment mode: Vercel routes these requests
    // to the serverless functions in the root `api/` directory. Rewriting that
    // path to itself makes Next consume the request and return a frontend 404.
    // Only add a proxy rewrite when the API URL points to a separate origin.
    if (HAS_ABSOLUTE_API) {
      rewrites.push({
        source: '/api/:path*',
        destination: `${API_URL}/:path*`,
      });
    }

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
