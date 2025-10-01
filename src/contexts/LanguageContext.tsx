'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type Locale, getTranslations, defaultLocale } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/locales/en';
import type { VietnameseTranslations } from '@/lib/i18n/locales/vi';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations | VietnameseTranslations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'checkpoint-locale';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [t, setT] = useState<Translations | VietnameseTranslations>(getTranslations(defaultLocale));

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'vi')) {
      setLocaleState(savedLocale);
      setT(getTranslations(savedLocale));
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setT(getTranslations(newLocale));
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

