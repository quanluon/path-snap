import { en } from './locales/en';
import { vi } from './locales/vi';

export type Locale = 'en' | 'vi';

export const locales: Record<Locale, typeof en | typeof vi> = {
  en,
  vi,
};

export const defaultLocale: Locale = 'en';

export function getTranslations(locale: Locale = defaultLocale) {
  return locales[locale] || locales[defaultLocale];
}

