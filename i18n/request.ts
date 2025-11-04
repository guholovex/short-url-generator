import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['en', 'zh'];

function isValidLocale(locale: string): locale is 'en' | 'zh' {
  return locales.includes(locale);
}

export default getRequestConfig(async ({ locale }) => {
  // 临时调试：console.log('Parsed locale:', locale);  // 在服务器日志中查看
  if (!locale || !isValidLocale(locale)) {
    // 触发 Next.js 的 notFound 机制，渲染 404 页面
    notFound();
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
