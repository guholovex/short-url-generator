import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  //匹配所有路径
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*|/|index.html).*)', // 排除 / 和 index.html
    '/([\\w-]+)?/(.+)', // 子路径如 [shortcode]、shorten],
  ],
};
