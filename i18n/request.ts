import { getRequestConfig } from 'next-intl/server';

const locales = ['en', 'zh'];

function isValidLocale(locale: string): locale is 'en' | 'zh' {
  return locales.includes(locale);
}

export default getRequestConfig(async ({ locale }) => {
  // 默认‘en'，避免 404
  const defaultLocale = 'en';
  const validLocale = locale && isValidLocale(locale) ? locale : defaultLocale;

  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default,
  };
});
