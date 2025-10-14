import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Vercel 빌드 시 ESLint 경고를 무시
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Vercel 빌드 시 TypeScript 오류를 무시 (프로덕션에서는 권장하지 않음)
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
