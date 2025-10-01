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
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
      aria-label="Switch language"
    >
      <LanguageIcon className="w-5 h-5 text-gray-700" />
      <span className="font-medium text-gray-700">
        {locale === 'en' ? 'EN' : 'VI'}
      </span>
    </button>
  );
}

