import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Configuration Next.js pour Kalan Blon */
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;