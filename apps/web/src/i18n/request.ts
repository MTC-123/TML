import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'fr';
  }

  return {
    locale,
    messages: {
      ...(await import(`../../public/locales/${locale}/common.json`)).default,
      ...(await import(`../../public/locales/${locale}/auth.json`)).default,
      ...(await import(`../../public/locales/${locale}/projects.json`)).default,
      ...(await import(`../../public/locales/${locale}/attestations.json`)).default,
      ...(await import(`../../public/locales/${locale}/public.json`)).default,
    },
  };
});
