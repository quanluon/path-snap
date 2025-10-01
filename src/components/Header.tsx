'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { MapPinIcon } from '@heroicons/react/24/solid';

export default function Header() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <MapPinIcon className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Checkpoint</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              {t.nav.home}
            </Link>
            <Link href="/upload" className="text-gray-700 hover:text-blue-600 transition-colors">
              {t.nav.upload}
            </Link>
            <Link href="/search" className="text-gray-700 hover:text-blue-600 transition-colors">
              {t.nav.search}
            </Link>
            <Link href="/plan" className="text-gray-700 hover:text-blue-600 transition-colors">
              {t.nav.plan}
            </Link>
          </nav>

          {/* Language Switcher */}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

