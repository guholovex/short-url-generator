import { getRequestConfig } from 'next-intl/server';
// import { notFound } from 'next/navigation';

const locales = ['en', 'zh'];

function isValidLocale(locale: string): locale is 'en' | 'zh' {
  return locales.includes(locale);
}

export default getRequestConfig(async ({ locale }) => {
  const validLocale = locale && isValidLocale(locale) ? locale : 'en';

  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default,
  };
});
