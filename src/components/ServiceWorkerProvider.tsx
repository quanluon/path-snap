'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { swManager, type SWMessage } from '@/lib/sw';

interface ServiceWorkerContextType {
  isSupported: boolean;
  isRegistered: boolean;
  isControlling: boolean;
  state: ServiceWorkerState | null;
  enableNotifications: () => Promise<NotificationPermission>;
  enableBackgroundSync: () => Promise<void>;
  storeUploadForSync: (uploadData: any) => Promise<void>;
  triggerSync: () => Promise<void>;
}

const ServiceWorkerContext = createContext<ServiceWorkerContextType | undefined>(undefined);

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isControlling, setIsControlling] = useState(false);
  const [state, setState] = useState<ServiceWorkerState | null>(null);

  useEffect(() => {
    const initServiceWorker = async () => {
      try {
        console.log('Initializing Service Worker...');
        
        // Register service worker
        const registration = await swManager.register();
        
        if (registration) {
          setIsRegistered(true);
          setIsControlling(swManager.isControlling);
          setState(swManager.state);

          // Listen for service worker messages
          swManager.onMessage((message: SWMessage) => {
            console.log('Received message from Service Worker:', message);
            
            switch (message.type) {
              case 'UPLOAD_SUCCESS':
                // Notify components about successful upload
                window.dispatchEvent(new CustomEvent('uploadSuccess', {
                  detail: message.data
                }));
                break;
              
              case 'UPLOAD_FAILED':
                // Notify components about failed upload
                window.dispatchEvent(new CustomEvent('uploadFailed', {
                  detail: message.data
                }));
                break;
              
              default:
                console.log('Unknown message from Service Worker:', message.type);
            }
          });

          // Enable background sync if supported
          await swManager.enableBackgroundSync();

          // Request notification permission
          await swManager.requestNotificationPermission();

          console.log('Service Worker initialized successfully');
        }
      } catch (error) {
        console.error('Failed to initialize Service Worker:', error);
      }
    };

    initServiceWorker();
  }, []);

  const enableNotifications = async () => {
    return await swManager.requestNotificationPermission();
  };

  const enableBackgroundSync = async () => {
    await swManager.enableBackgroundSync();
  };

  const storeUploadForSync = async (uploadData: any) => {
    await swManager.storeUploadForSync(uploadData);
  };

  const triggerSync = async () => {
    await swManager.triggerSync();
  };

  const contextValue: ServiceWorkerContextType = {
    isSupported: typeof window !== 'undefined' && 'serviceWorker' in navigator,
    isRegistered,
    isControlling,
    state,
    enableNotifications,
    enableBackgroundSync,
    storeUploadForSync,
    triggerSync,
  };

  return (
    <ServiceWorkerContext.Provider value={contextValue}>
      {children}
    </ServiceWorkerContext.Provider>
  );
}

export function useServiceWorker() {
  const context = useContext(ServiceWorkerContext);
  if (context === undefined) {
    throw new Error('useServiceWorker must be used within a ServiceWorkerProvider');
  }
  return context;
}
