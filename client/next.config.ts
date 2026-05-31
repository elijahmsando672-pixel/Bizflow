import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  compiler: {
    styledComponents: true,
  },
  output: process.env.VERCEL ? undefined : 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${API_ORIGIN}/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
