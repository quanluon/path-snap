'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useLanguage } from '@/contexts/LanguageContext';
import { BellIcon, BellSlashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface NotificationSettingsProps {
  className?: string;
  onTestNotification?: (type: 'reaction' | 'comment') => void;
  isTestingNotification?: boolean;
}

export default function NotificationSettings({ 
  className = '', 
  onTestNotification, 
  isTestingNotification = false 
}: NotificationSettingsProps) {
  const { t } = useLanguage();
  const { 
    isSupported, 
    permission, 
    requestPermission 
  } = useNotifications();
  
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPermission = async () => {
    if (permission === 'granted') return;
    
    setIsRequesting(true);
    try {
      const newPermission = await requestPermission();
      console.log('Permission request result:', newPermission);
    } catch (error) {
      console.error('Error requesting permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const getPermissionStatus = () => {
    if (!isSupported) {
      return {
        icon: XCircleIcon,
        text: t.settings.notifications.notSupported,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20'
      };
    }

    switch (permission) {
      case 'granted':
        return {
          icon: CheckCircleIcon,
          text: t.settings.notifications.enabled,
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20'
        };
      case 'denied':
        return {
          icon: XCircleIcon,
          text: t.settings.notifications.disabled,
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20'
        };
      default:
        return {
          icon: BellSlashIcon,
          text: t.settings.notifications.notRequested,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20'
        };
    }
  };

  const status = getPermissionStatus();
  const StatusIcon = status.icon;

  return (
    <div className={`bg-dark-card rounded-lg shadow-dark-primary border border-dark-primary p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <BellIcon className="w-6 h-6 text-dark-primary" />
          <h3 className="text-lg font-semibold text-white">
            {t.settings.notifications.title}
          </h3>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.borderColor} border`}>
          <StatusIcon className={`w-4 h-4 ${status.color}`} />
          <span className={status.color}>{status.text}</span>
        </div>
      </div>

      <p className="text-dark-secondary mb-4">
        {t.settings.notifications.description}
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-dark-hover rounded-lg">
          <div>
            <p className="text-white font-medium">{t.settings.notifications.reactions}</p>
            <p className="text-dark-muted text-sm">{t.settings.notifications.reactionsDesc}</p>
          </div>
          <div className={`w-3 h-3 rounded-full ${permission === 'granted' ? 'bg-green-400' : 'bg-gray-600'}`}></div>
        </div>

        <div className="flex items-center justify-between p-3 bg-dark-hover rounded-lg">
          <div>
            <p className="text-white font-medium">{t.settings.notifications.comments}</p>
            <p className="text-dark-muted text-sm">{t.settings.notifications.commentsDesc}</p>
          </div>
          <div className={`w-3 h-3 rounded-full ${permission === 'granted' ? 'bg-green-400' : 'bg-gray-600'}`}></div>
        </div>
      </div>

      {permission !== 'granted' && isSupported && (
        <div className="mt-6 pt-4 border-t border-dark-primary">
          <button
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isRequesting ? t.settings.notifications.requesting : t.settings.notifications.enable}
          </button>
          <p className="text-dark-muted text-xs mt-2 text-center">
            {t.settings.notifications.permissionNote}
          </p>
        </div>
      )}

      {permission === 'granted' && onTestNotification && (
        <div className="mt-6 pt-4 border-t border-dark-primary">
          <p className="text-white font-medium mb-3">Test Notifications</p>
          <div className="flex gap-2">
            <button
              onClick={() => onTestNotification('reaction')}
              disabled={isTestingNotification}
              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Test Reaction
            </button>
            <button
              onClick={() => onTestNotification('comment')}
              disabled={isTestingNotification}
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Test Comment
            </button>
          </div>
        </div>
      )}

      {!isSupported && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">
            {t.settings.notifications.browserNotSupported}
          </p>
        </div>
      )}
    </div>
  );
}
