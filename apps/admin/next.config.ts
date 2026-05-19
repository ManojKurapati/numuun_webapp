import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // Workspace packages shipped as TypeScript source.
  transpilePackages: ['@namo/ui', '@namo/api-client'],
  // Linting runs as its own pipeline step (`pnpm lint`), not during build.
  eslint: { ignoreDuringBuilds: true },
};

export default config;
