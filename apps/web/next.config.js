/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@bizflow/ui', '@bizflow/utils'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  },
};

module.exports = nextConfig;
