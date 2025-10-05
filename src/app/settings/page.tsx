'use client';

import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import NotificationSettings from '@/components/NotificationSettings';
import AuthModal from '@/components/AuthModal';
import ProfileEditModal from '@/components/ProfileEditModal';
import { useRouter } from 'next/navigation';
import { 
  UserIcon, 
  GlobeAltIcon, 
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  HeartIcon,
  ArrowDownTrayIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import OptimizedImage from '@/components/OptimizedImage';

export default function SettingsPage() {
  const { user, refreshUser } = useUser();
  const { t } = useLanguage();
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);

  const testNotification = async (type: 'reaction' | 'comment') => {
    if (!user) return;
    
    setIsTestingNotification(true);
    try {
      const response = await fetch('/api/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          imageId: 'test-image-123',
          reactorName: type === 'reaction' ? 'Test User' : undefined,
          commenterName: type === 'comment' ? 'Test Commenter' : undefined,
        }),
      });

      if (response.ok) {
        console.log(`${type} notification test sent successfully`);
      } else {
        console.error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error testing notification:', error);
    } finally {
      setIsTestingNotification(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // Redirect to home page after logout
        router.push('/');
        window.location.reload();
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleContactSupport = () => {
    // Open email client with support email
    const subject = encodeURIComponent('Checkpoint App Support Request');
    const body = encodeURIComponent(`Hello Checkpoint Support Team,\n\nI need help with:\n\n[Please describe your issue here]\n\nUser ID: ${user?.id}\nEmail: ${user?.email}\n\nThank you!`);
    window.open(`mailto:support@checkpoint.app?subject=${subject}&body=${body}`);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeletingAccount(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        // Redirect to home page after account deletion
        router.push('/');
        window.location.reload();
      } else {
        console.error('Account deletion failed');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/profile/export', {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `checkpoint-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Data export failed');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleProfileUpdate = async () => {
    // Refresh user context to get updated profile data
    await refreshUser();
  };

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 p-8">
            <Cog6ToothIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">
              {t.settings.loginPrompt.title}
            </h1>
            <p className="text-gray-400 mb-6">
              {t.settings.loginPrompt.subtitle}
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors"
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
        <h1 className="text-3xl font-bold text-white mb-2">{t.settings.title}</h1>
        <p className="text-gray-400">{t.settings.subtitle}</p>
      </div>

      {/* User Profile Section */}
      <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 p-6 mb-6">
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
            <h2 className="text-xl font-semibold text-white">
              {user.name || user.email?.split('@')[0] || 'User'}
            </h2>
            <p className="text-gray-400">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => setShowProfileEditModal(true)}
            className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
          >
            <UserIcon className="w-5 h-5 text-gray-300" />
            <div>
              <p className="text-white font-medium">Edit Profile</p>
              <p className="text-gray-400 text-sm">Update your name and avatar</p>
            </div>
          </button>
          <button 
            onClick={() => router.push(`/profile/${user.id}`)}
            className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
          >
            <ShieldCheckIcon className="w-5 h-5 text-gray-300" />
            <div>
              <p className="text-white font-medium">View Profile</p>
              <p className="text-gray-400 text-sm">See your public profile</p>
            </div>
          </button>
        </div>
      </div>

      {/* App Settings */}
      <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 p-6 mb-6">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Cog6ToothIcon className="w-5 h-5" />
          {t.settings.title}
        </h3>

        <div className="space-y-4">
          {/* Language Setting */}
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <GlobeAltIcon className="w-5 h-5 text-gray-300" />
              <div>
                <p className="text-white font-medium">{t.settings.language.title}</p>
                <p className="text-gray-400 text-sm">{t.settings.language.subtitle}</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Data Export */}
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <ArrowDownTrayIcon className="w-5 h-5 text-gray-300" />
              <div>
                <p className="text-white font-medium">Export Data</p>
                <p className="text-gray-400 text-sm">Download your data as JSON</p>
              </div>
            </div>
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 p-6 mb-6">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <ShieldCheckIcon className="w-5 h-5" />
          Privacy Settings
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div>
              <p className="text-white font-medium">Profile Visibility</p>
              <p className="text-gray-400 text-sm">Make your profile public or private</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div>
              <p className="text-white font-medium">Location Sharing</p>
              <p className="text-gray-400 text-sm">Allow location data in your images</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div>
              <p className="text-white font-medium">Analytics</p>
              <p className="text-gray-400 text-sm">Help improve the app with usage data</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <NotificationSettings 
        className="mb-6" 
        onTestNotification={testNotification}
        isTestingNotification={isTestingNotification}
      />

      {/* About Section */}
      <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 p-6 mb-6">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <InformationCircleIcon className="w-5 h-5" />
          {t.settings.about.title}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div>
              <p className="text-white font-medium">{t.settings.about.version}</p>
              <p className="text-gray-400 text-sm">Checkpoint v1.0.0</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <HeartIcon className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-white font-medium">{t.settings.about.support}</p>
                <p className="text-gray-400 text-sm">{t.settings.about.subtitle}</p>
              </div>
            </div>
            <button 
              onClick={handleContactSupport}
              className="px-4 py-2 text-white border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {t.settings.about.contact}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-gray-900 rounded-lg shadow-2xl border border-red-500/30 p-6">
        <h3 className="text-xl font-semibold text-red-400 mb-6 flex items-center gap-2">
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          {t.settings.account.title}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-900/20 rounded-lg">
            <div>
              <p className="text-red-400 font-medium">{t.settings.account.signOut}</p>
              <p className="text-gray-400 text-sm">{t.settings.account.signOutSubtitle}</p>
            </div>
            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 text-red-400 border border-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
            >
              {isLoggingOut ? 'Signing out...' : t.settings.account.signOut}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-900/20 rounded-lg">
            <div className="flex items-center gap-3">
              <TrashIcon className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-red-400 font-medium">Delete Account</p>
                <p className="text-gray-400 text-sm">Permanently delete your account and all data</p>
              </div>
            </div>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 text-red-400 border border-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black bg-opacity-80" onClick={() => setShowDeleteModal(false)} />
            <div className="relative inline-block w-full max-w-md overflow-hidden text-left align-middle transition-all transform bg-gray-900 rounded-lg shadow-2xl border border-red-500">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrashIcon className="w-6 h-6 text-red-400" />
                  <h3 className="text-lg font-semibold text-white">Delete Account</h3>
                </div>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data including images, plans, and comments.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50"
                  >
                    {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={showProfileEditModal}
        onClose={() => setShowProfileEditModal(false)}
        onUpdate={handleProfileUpdate}
      />
    </div>
  );
}
