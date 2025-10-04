'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface NotificationPermissionPromptProps {
  className?: string;
}

export default function NotificationPermissionPrompt({ className = '' }: NotificationPermissionPromptProps) {
  const { user } = useUser();
  const { t } = useLanguage();
  const { isSupported, permission, requestPermission } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Show prompt if:
    // 1. User is logged in
    // 2. Notifications are supported
    // 3. Permission is default (not requested yet)
    // 4. User hasn't dismissed the prompt before
    if (user && isSupported && permission === 'default') {
      const hasPromptedBefore = localStorage.getItem('notification-prompt-dismissed');
      if (!hasPromptedBefore) {
        // Delay showing the prompt to avoid showing it immediately on page load
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 3000); // Show after 3 seconds

        return () => clearTimeout(timer);
      }
    }
  }, [user, isSupported, permission]);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const newPermission = await requestPermission();
      if (newPermission === 'granted') {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('notification-prompt-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 ${className}`}>
      <div className="bg-dark-card border border-dark-primary rounded-lg shadow-lg p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <BellIcon className="w-6 h-6 text-blue-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium text-sm mb-1">
              {t.settings.notifications.title}
            </h3>
            <p className="text-dark-secondary text-sm mb-3">
              {t.settings.notifications.description}
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRequesting ? t.settings.notifications.requesting : t.settings.notifications.enable}
              </button>
              
              <button
                onClick={handleDismiss}
                disabled={isRequesting}
                className="px-3 py-1.5 bg-dark-secondary text-dark-primary text-sm rounded-md hover:bg-dark-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t.profile.cancel}
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-dark-muted hover:text-white transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
