/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle for a small production Docker image.
  // Enabled only in the Docker build (Linux); skipped locally so Windows dev
  // isn't blocked by symlink privileges during trace collection.
  output: process.env.BUILD_STANDALONE ? 'standalone' : undefined,
  // Linting is handled at the monorepo level / in a later phase.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
