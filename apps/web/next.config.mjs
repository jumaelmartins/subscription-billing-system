/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.BUILD_STANDALONE ? 'standalone' : undefined,
  eslint: { ignoreDuringBuilds: true },
  // Same-origin proxy to the API. The browser always calls /api/* on this host,
  // so the httpOnly auth cookie (host-only) flows without cross-site concerns.
  async rewrites() {
    const api = process.env.API_INTERNAL_URL ?? 'http://localhost:3333';
    return [{ source: '/api/:path*', destination: `${api}/:path*` }];
  },
};

export default nextConfig;
