/**
 * Browser notification service for real-time push notifications
 */

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export class NotificationService {
  private static instance: NotificationService;
  private isSupported: boolean;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.isSupported = typeof window !== 'undefined' && 'Notification' in window;
    if (this.isSupported) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Handle navigation from notification click
   */
  private handleNotificationNavigation(url: string): void {
    try {
      console.log('Attempting navigation to:', url);
      
      // Check if we're in a Next.js environment with router
      if (typeof window !== 'undefined') {
        // Try to use Next.js router if available
        const windowWithRouter = window as Window & {
          notificationRouter?: { push: (url: string) => void };
          next?: { router?: { push: (url: string) => void } };
        };
        
        if (windowWithRouter.notificationRouter) {
          console.log('Using notification router for navigation');
          windowWithRouter.notificationRouter.push(url);
        } else if (windowWithRouter.next?.router) {
          console.log('Using Next.js router for navigation');
          windowWithRouter.next.router.push(url);
        } else {
          console.log('Using window.location.href for navigation');
          // Fallback to regular navigation
          window.location.href = url;
        }
      }
    } catch (error) {
      console.error('Error navigating from notification:', error);
      // Fallback to regular navigation
      window.location.href = url;
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Check if notifications are supported
   */
  public isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get current permission status
   */
  public getPermission(): NotificationPermission {
    return this.permission;
  }

  /**
   * Request notification permission from user
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Notifications are not supported in this browser');
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Send a browser notification
   */
  public async sendNotification(data: NotificationData): Promise<void> {
    if (!this.isSupported) {
      console.warn('Notifications are not supported');
      return;
    }

    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        tag: data.tag,
        data: data.data,
        requireInteraction: false,
        silent: false,
      });

      // Auto-close notification after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        notification.close();
        
        // Focus the window
        window.focus();
        
        // Handle navigation based on notification type
        if (data.data?.type === 'reaction' && data.data?.imageId && typeof data.data.imageId === 'string') {
          // For reaction notifications, navigate to the image detail page using imageId
          const imageDetailUrl = `/image/${data.data.imageId}`;
          console.log('Navigating to image detail:', imageDetailUrl);
          this.handleNotificationNavigation(imageDetailUrl);
        } else if (data.data?.url && typeof data.data.url === 'string') {
          // For other notification types, use general navigation
          console.log('Navigating to URL:', data.data.url);
          this.handleNotificationNavigation(data.data.url);
        }
      };

    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Send a reaction notification to the image author
   */
  public async sendReactionNotification({
    reactorName,
    reactionType,
    imageId,
    imageUrl,
    authorId,
  }: {
    reactorName: string;
    reactionType: string;
    imageId: string;
    imageUrl?: string;
    authorId: string;
  }): Promise<void> {
    const reactionEmojis = {
      like: '👍',
      heart: '❤️',
      wow: '😊',
      haha: '😄',
    };

    const emoji = reactionEmojis[reactionType as keyof typeof reactionEmojis] || '👍';
    const title = `${emoji} New Reaction!`;
    const body = `${reactorName} reacted ${reactionType} to your image`;

    // Send browser notification
    await this.sendNotification({
      title,
      body,
      icon: '/icon-192.png',
      image: imageUrl,
      tag: `reaction-${imageId}`,
      data: {
        type: 'reaction',
        imageId,
        authorId,
        reactionType,
        url: `/image/${imageId}`,
      },
    });

    // Also show toast notification
    this.showToast({
      type: 'reaction',
      title,
      content: body,
      imageUrl,
      duration: 5000,
      action: {
        label: 'View',
        onClick: () => this.navigateToImageDetail(imageId),
      },
    });
  }

  /**
   * Send a comment notification to the image author
   */
  public async sendCommentNotification({
    commenterName,
    imageId,
    imageUrl,
    commentContent,
    authorId,
  }: {
    commenterName: string;
    imageId: string;
    imageUrl?: string;
    commentContent?: string;
    authorId: string;
  }): Promise<void> {
    const title = `💬 New Comment!`;
    const body = commentContent 
      ? `${commenterName}: ${commentContent.length > 50 ? commentContent.substring(0, 50) + '...' : commentContent}`
      : `${commenterName} commented on your image`;

    // Send browser notification
    await this.sendNotification({
      title,
      body,
      icon: '/icon-192.png',
      image: imageUrl,
      tag: `comment-${imageId}`,
      data: {
        type: 'comment',
        imageId,
        authorId,
        url: `/image/${imageId}`,
      },
    });

    // Also show toast notification
    this.showToast({
      type: 'comment',
      title,
      content: body,
      imageUrl,
      duration: 7000, // Longer duration for comments
      action: {
        label: 'View',
        onClick: () => this.navigateToImageDetail(imageId),
      },
    });
  }

  /**
   * Navigate to image detail page using imageId
   */
  public navigateToImageDetail(imageId: string): void {
    const imageDetailUrl = `/image/${imageId}`;
    this.handleNotificationNavigation(imageDetailUrl);
  }

  /**
   * Clear all notifications with a specific tag
   */
  public clearNotifications(): void {
    if (!this.isSupported) return;

    // Note: There's no direct API to clear notifications by tag
    // This is handled by the browser automatically when new notifications
    // with the same tag are created
    console.log('Notifications will be cleared automatically by browser');
  }

  /**
   * Show a toast notification
   */
  public showToast(toast: Omit<import('@/contexts/ToastContext').ToastData, 'id'>): void {
    // This will be implemented by the toast context
    // For now, we'll dispatch a custom event that the toast context can listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: toast }));
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
