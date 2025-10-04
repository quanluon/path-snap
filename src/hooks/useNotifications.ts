"use client";

import { useEffect, useState, useCallback } from 'react';
import { notificationService, type NotificationData } from '@/lib/notifications';

interface UseNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  sendNotification: (data: NotificationData) => Promise<void>;
  sendReactionNotification: (params: {
    reactorName: string;
    reactionType: string;
    imageId: string;
    imageUrl?: string;
    authorId: string;
  }) => Promise<void>;
  sendCommentNotification: (params: {
    commenterName: string;
    imageId: string;
    imageUrl?: string;
    authorId: string;
  }) => Promise<void>;
  navigateToImageDetail: (imageId: string) => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(notificationService.isNotificationSupported());
    setPermission(notificationService.getPermission());
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      const newPermission = await notificationService.requestPermission();
      setPermission(newPermission);
      return newPermission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }, []);

  const sendNotification = useCallback(async (data: NotificationData): Promise<void> => {
    try {
      await notificationService.sendNotification(data);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, []);

  const sendReactionNotification = useCallback(async (params: {
    reactorName: string;
    reactionType: string;
    imageId: string;
    imageUrl?: string;
    authorId: string;
  }): Promise<void> => {
    try {
      await notificationService.sendReactionNotification(params);
    } catch (error) {
      console.error('Error sending reaction notification:', error);
    }
  }, []);

  const sendCommentNotification = useCallback(async (params: {
    commenterName: string;
    imageId: string;
    imageUrl?: string;
    authorId: string;
  }): Promise<void> => {
    try {
      await notificationService.sendCommentNotification(params);
    } catch (error) {
      console.error('Error sending comment notification:', error);
    }
  }, []);

  const navigateToImageDetail = useCallback((imageId: string): void => {
    notificationService.navigateToImageDetail(imageId);
  }, []);

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    sendReactionNotification,
    sendCommentNotification,
    navigateToImageDetail,
  };
}
