import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  // TypeScript runs explicitly in npm run build; skip Next's duplicate worker check.
  typescript: { ignoreBuildErrors: true },
};
export default nextConfig;
