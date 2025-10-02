'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageIcon } from '@heroicons/react/16/solid';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'vi' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-card border border-dark-primary hover:bg-dark-hover transition-colors"
      aria-label="Switch language"
    >
      <LanguageIcon className="w-5 h-5 text-dark-primary" />
      <span className="font-medium text-dark-primary">
        {locale === 'en' ? 'EN' : 'VI'}
      </span>
    </button>
  );
}

