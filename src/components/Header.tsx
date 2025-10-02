'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import LanguageSwitcher from './LanguageSwitcher';
import { MapPinIcon, UserCircleIcon, ArrowRightOnRectangleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function Header() {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      setIsProfileOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-dark-card/80 backdrop-blur-md border-b border-dark-primary shadow-dark-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover-dark-card p-2 rounded-lg">
            <MapPinIcon className="w-8 h-8 text-dark-primary" />
            <span className="text-xl font-bold text-dark-primary">Checkpoint</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-dark-secondary hover:text-dark-primary transition-colors px-3 py-2 rounded-lg hover:bg-dark-hover">
              {t.nav.home}
            </Link>
            <Link href="/upload" className="text-dark-secondary hover:text-dark-primary transition-colors px-3 py-2 rounded-lg hover:bg-dark-hover">
              {t.nav.upload}
            </Link>
            <Link href="/search" className="text-dark-secondary hover:text-dark-primary transition-colors px-3 py-2 rounded-lg hover:bg-dark-hover">
              {t.nav.search}
            </Link>
            <Link href="/plan" className="text-dark-secondary hover:text-dark-primary transition-colors px-3 py-2 rounded-lg hover:bg-dark-hover">
              {t.nav.plan}
            </Link>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {/* Profile Dropdown */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-dark-hover transition-colors"
                >
                  <UserCircleIcon className="w-6 h-6 text-dark-primary" />
                  <span className="hidden sm:block text-sm text-dark-primary font-medium">
                    {user.email?.split('@')[0] || 'User'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-dark-card rounded-lg shadow-dark-secondary border border-dark-primary py-1 z-50">
                    <div className="px-4 py-2 border-b border-dark-primary">
                      <p className="text-sm text-dark-primary font-medium">{user.email}</p>
                      <p className="text-xs text-dark-muted">{user.user_metadata?.name || 'No name'}</p>
                    </div>
                    
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-dark-secondary hover:bg-dark-hover transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Cog6ToothIcon className="w-4 h-4" />
                      Profile Settings
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-dark-secondary hover:bg-dark-hover transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/upload"
                className="px-4 py-2 bg-dark-primary text-dark-secondary rounded-lg hover:bg-dark-hover transition-colors text-sm font-medium"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

