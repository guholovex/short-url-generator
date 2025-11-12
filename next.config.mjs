import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin({
  // 自定义 request 配置路径
  configPath: './i18n/request.ts',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    webpackBuildWorker: true, // 消除警告
  },
  // Vercel 优化：启用 standalone 模式
  output: 'standalone', // 推荐：Vercel 服务器less 兼容
};

export default withNextIntl(nextConfig);
