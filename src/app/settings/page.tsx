'use client';

import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import AuthModal from '@/components/AuthModal';
import { 
  UserIcon, 
  GlobeAltIcon, 
  BellIcon, 
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import OptimizedImage from '@/components/OptimizedImage';

export default function SettingsPage() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-dark-card rounded-lg shadow-dark-primary border border-dark-primary p-8">
            <Cog6ToothIcon className="w-16 h-16 text-dark-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-dark-primary mb-4">
              {t.settings.loginPrompt.title}
            </h1>
            <p className="text-dark-secondary mb-6">
              {t.settings.loginPrompt.subtitle}
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-6 py-3 bg-dark-primary text-dark-secondary font-medium rounded-lg hover:bg-dark-hover transition-colors border border-dark-primary"
            >
              {t.settings.loginPrompt.login}
            </button>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          mode={authMode}
          onModeChange={setAuthMode}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-primary mb-2">{t.settings.title}</h1>
        <p className="text-dark-secondary">{t.settings.subtitle}</p>
      </div>

      {/* User Profile Section */}
      <div className="bg-dark-card rounded-lg shadow-dark-primary border border-dark-primary p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            {user.avatarUrl ? (
              <OptimizedImage
                src={user.avatarUrl}
                alt={user.name || 'User'}
                className="rounded-full object-cover"
                width={16}
                height={16}
              />
            ) : (
              <UserIcon className="w-8 h-8 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-dark-primary">
              {user.name || 'User'}
            </h2>
            <p className="text-dark-secondary">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-dark-hover rounded-lg">
            <UserIcon className="w-5 h-5 text-dark-primary" />
            <div>
              <p className="text-dark-primary font-medium">{t.settings.profile.title}</p>
              <p className="text-dark-secondary text-sm">{t.settings.profile.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-dark-hover rounded-lg">
            <ShieldCheckIcon className="w-5 h-5 text-dark-primary" />
            <div>
              <p className="text-dark-primary font-medium">{t.settings.privacy.title}</p>
              <p className="text-dark-secondary text-sm">{t.settings.privacy.subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* App Settings */}
      <div className="bg-dark-card rounded-lg shadow-dark-primary border border-dark-primary p-6 mb-6">
        <h3 className="text-xl font-semibold text-dark-primary mb-6 flex items-center gap-2">
          <Cog6ToothIcon className="w-5 h-5" />
          {t.settings.title}
        </h3>

        <div className="space-y-4">
          {/* Language Setting */}
          <div className="flex items-center justify-between p-4 bg-dark-hover rounded-lg">
            <div className="flex items-center gap-3">
              <GlobeAltIcon className="w-5 h-5 text-dark-primary" />
              <div>
              <p className="text-dark-primary font-medium">{t.settings.language.title}</p>
              <p className="text-dark-secondary text-sm">{t.settings.language.subtitle}</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Notifications Setting */}
          <div className="flex items-center justify-between p-4 bg-dark-hover rounded-lg">
            <div className="flex items-center gap-3">
              <BellIcon className="w-5 h-5 text-dark-primary" />
              <div>
              <p className="text-dark-primary font-medium">{t.settings.notifications.title}</p>
              <p className="text-dark-secondary text-sm">{t.settings.notifications.subtitle}</p>
              </div>
            </div>
            <button className="px-4 py-2 text-dark-primary border border-dark-primary rounded-lg hover:bg-dark-primary hover:text-dark-secondary transition-colors">
{t.settings.notifications.configure}
            </button>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-dark-card rounded-lg shadow-dark-primary border border-dark-primary p-6 mb-6">
        <h3 className="text-xl font-semibold text-dark-primary mb-6 flex items-center gap-2">
          <InformationCircleIcon className="w-5 h-5" />
          {t.settings.about.title}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-dark-hover rounded-lg">
            <div>
              <p className="text-dark-primary font-medium">{t.settings.about.version}</p>
              <p className="text-dark-secondary text-sm">Checkpoint v1.0.0</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-dark-hover rounded-lg">
            <div className="flex items-center gap-3">
              <HeartIcon className="w-5 h-5 text-red-500" />
              <div>
              <p className="text-dark-primary font-medium">{t.settings.about.support}</p>
              <p className="text-dark-secondary text-sm">{t.settings.about.subtitle}</p>
              </div>
            </div>
            <button className="px-4 py-2 text-dark-primary border border-dark-primary rounded-lg hover:bg-dark-primary hover:text-dark-secondary transition-colors">
{t.settings.about.contact}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-dark-card rounded-lg shadow-dark-primary border border-red-500/20 p-6">
        <h3 className="text-xl font-semibold text-red-400 mb-6 flex items-center gap-2">
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          {t.settings.account.title}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg">
            <div>
              <p className="text-red-400 font-medium">{t.settings.account.signOut}</p>
              <p className="text-dark-secondary text-sm">{t.settings.account.signOutSubtitle}</p>
            </div>
            <button className="px-4 py-2 text-red-400 border border-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
{t.settings.account.signOut}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
