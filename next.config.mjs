import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin({
  // 自定义 request 配置路径
  configPath: './i18n/request.ts',
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withNextIntl(nextConfig);
