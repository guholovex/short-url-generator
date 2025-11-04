import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  //匹配所有路径
  matcher: [
    // 排除根 / 和静态/API，避免拦截首页
    '/((?!api|_next|_vercel|.*\\..*|/|index.html).*)',
    '/([\\w-]+)?/(.+)', // 只匹配子路径，如 [shortcode]、shorten
  ],
};
