"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationListenerProps {
  children: React.ReactNode;
}

export default function NotificationListener({ children }: NotificationListenerProps) {
  const { user } = useUser();
  const { isSupported, permission, requestPermission, sendReactionNotification } = useNotifications();
  const supabase = createClient();
  const router = useRouter();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Request notification permission when user is logged in
    if (user && isSupported && permission === 'default') {
      requestPermission();
    }
  }, [user, isSupported, permission, requestPermission]);

  // Set up custom navigation handler for notifications
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Make the Next.js router available globally for notification navigation
      const windowWithRouter = window as Window & {
        notificationRouter?: { push: (url: string) => void };
      };
      windowWithRouter.notificationRouter = router;
    }
  }, [router]);

  useEffect(() => {
    if (!user?.id) {
      // Clean up channel if user logs out
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // Subscribe to notifications for this user
    const channel = supabase.channel(`notifications:${user.id}`)
      .on('broadcast', { event: 'reaction_notification' }, async (payload) => {
        console.log('Received reaction notification:', payload);
        
        const { reactorName, reactionType, imageId, imageUrl } = payload;
        
        // Show browser notification
        await sendReactionNotification({
          reactorName,
          reactionType,
          imageId,
          imageUrl,
          authorId: user.id,
        });
      })
      .subscribe((status) => {
        console.log('Notification subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, sendReactionNotification, supabase]);

  return <>{children}</>;
}
