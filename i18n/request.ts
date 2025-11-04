import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['en', 'zh'];

function isValidLocale(locale: string) {
  return locales.includes(locale);
}

export default getRequestConfig(async ({ locale }) => {
  // 默认‘en'，避免 404
  const validLocale = isValidLocale(locale) ? locale : 'en';

  return {
    locale: validLocale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
