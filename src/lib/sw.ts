/**
 * Service Worker utilities for PathSnap
 */

export interface SWMessage {
  type: string;
  data?: any;
}

export interface UploadData {
  formData: FormData;
  metadata?: {
    description?: string;
    latitude?: number;
    longitude?: number;
    planId?: string;
  };
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator;

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported) {
      console.log('Service Worker not supported');
      return null;
    }

    try {
      console.log('Registering Service Worker...');
      
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('Service Worker registered successfully:', this.registration);

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New Service Worker available, reloading...');
              // Notify user about update
              this.notifyUpdate();
            }
          });
        }
      });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed, reloading...');
        window.location.reload();
      });

      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const result = await this.registration.unregister();
      console.log('Service Worker unregistered:', result);
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  async update(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
      console.log('Service Worker update triggered');
    } catch (error) {
      console.error('Service Worker update failed:', error);
    }
  }

  async skipWaiting(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      console.log('Service Worker skip waiting triggered');
    } catch (error) {
      console.error('Service Worker skip waiting failed:', error);
    }
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return null;
    }

    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.log('VAPID key not configured');
        return null;
      }

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidKey)
      });

      console.log('Push subscription created:', subscription);
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Push subscription removed');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Push unsubscription failed:', error);
      return false;
    }
  }

  async enableBackgroundSync(): Promise<void> {
    if (!this.registration || !('serviceWorker' in navigator)) {
      console.log('Background sync not supported');
      return;
    }

    try {
      // Check if sync is available on the registration
      const syncManager = (this.registration as any).sync;
      if (!syncManager) {
        console.log('Background sync not supported');
        return;
      }

      await syncManager.register('upload-sync');
      console.log('Background sync registered');
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }

  async storeUploadForSync(uploadData: UploadData): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.active?.postMessage({
        type: 'STORE_UPLOAD',
        data: uploadData
      });
      console.log('Upload stored for background sync');
    } catch (error) {
      console.error('Failed to store upload for sync:', error);
    }
  }

  async triggerSync(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.active?.postMessage({
        type: 'SYNC_UPLOADS'
      });
      console.log('Background sync triggered');
    } catch (error) {
      console.error('Failed to trigger sync:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer;
  }

  private notifyUpdate(): void {
    // You can implement a custom update notification here
    if (confirm('A new version of PathSnap is available. Would you like to update now?')) {
      this.skipWaiting();
    }
  }

  // Listen for messages from service worker
  onMessage(callback: (message: SWMessage) => void): void {
    if (!this.isSupported) return;

    navigator.serviceWorker.addEventListener('message', (event) => {
      callback(event.data);
    });
  }

  // Check if service worker is controlling the page
  get isControlling(): boolean {
    return this.isSupported && !!navigator.serviceWorker.controller;
  }

  // Get registration status
  get isRegistered(): boolean {
    return !!this.registration;
  }

  // Get service worker state
  get state(): ServiceWorkerState | null {
    return this.registration?.active?.state || null;
  }
}

// Export singleton instance
export const swManager = new ServiceWorkerManager();

// Export utility functions
export const registerServiceWorker = () => swManager.register();
export const unregisterServiceWorker = () => swManager.unregister();
export const updateServiceWorker = () => swManager.update();
export const enableNotifications = () => swManager.requestNotificationPermission();
export const enableBackgroundSync = () => swManager.enableBackgroundSync();
