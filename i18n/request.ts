import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['en', 'zh'];

function isValidLocale(locale: string) {
  return locales.includes(locale);
}

export default getRequestConfig(async ({ locale }) => {
  if (!isValidLocale(locale)) notFound();

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
