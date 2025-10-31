/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel 优化
  experimental: { serverComponentsExternalPackages: ['@vercel/postgres'] },
};

module.exports = nextConfig;
