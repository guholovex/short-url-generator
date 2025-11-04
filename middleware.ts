import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // 匹配所有非 API 和非静态文件的路径
  matcher: ['/((?!api|_next/static|_next/image|_vercel|.*\\..*|index.html).*)'],
};
