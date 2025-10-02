// Service Worker for PathSnap
// Handles real-time updates, background sync, and push notifications

const CACHE_NAME = 'pathsnap-v1';
const STATIC_CACHE = 'pathsnap-static-v1';
const DYNAMIC_CACHE = 'pathsnap-dynamic-v1';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/upload',
  '/search',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests with cache strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for unsupported schemes
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'moz-extension:' || 
      url.protocol === 'ms-browser-extension:' ||
      url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok && response.status < 400) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                try {
                  cache.put(request, responseClone);
                } catch (error) {
                  console.warn('Failed to cache API response:', error);
                }
              });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then((response) => {
              if (response.ok && response.status < 400) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => {
                    try {
                      cache.put(request, responseClone);
                    } catch (error) {
                      console.warn('Failed to cache static asset:', error);
                    }
                  });
              }
              return response;
            });
        })
    );
  }
});

// Background sync for uploads
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'upload-sync') {
    event.waitUntil(
      syncUploads()
    );
  }
});

// Sync pending uploads
async function syncUploads() {
  try {
    const pendingUploads = await getStoredUploads();
    console.log('Syncing pending uploads:', pendingUploads.length);
    
    for (const upload of pendingUploads) {
      try {
        await retryUpload(upload);
        await removeStoredUpload(upload.id);
      } catch (error) {
        console.error('Failed to sync upload:', upload.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Store upload data for background sync
async function storeUpload(uploadData) {
  try {
    const uploads = await getStoredUploads();
    uploads.push({
      id: Date.now().toString(),
      data: uploadData,
      timestamp: Date.now()
    });
    await setStoredUploads(uploads);
  } catch (error) {
    console.error('Failed to store upload:', error);
  }
}

// Get stored uploads from IndexedDB
async function getStoredUploads() {
  return new Promise((resolve) => {
    const request = indexedDB.open('pathsnap-uploads', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('uploads')) {
        db.createObjectStore('uploads', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['uploads'], 'readonly');
      const store = transaction.objectStore('uploads');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
      
      getAllRequest.onerror = () => {
        resolve([]);
      };
    };
    
    request.onerror = () => {
      resolve([]);
    };
  });
}

// Set stored uploads in IndexedDB
async function setStoredUploads(uploads) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pathsnap-uploads', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('uploads')) {
        db.createObjectStore('uploads', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['uploads'], 'readwrite');
      const store = transaction.objectStore('uploads');
      
      // Clear existing uploads
      store.clear();
      
      // Add new uploads
      uploads.forEach(upload => {
        store.add(upload);
      });
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Remove stored upload
async function removeStoredUpload(uploadId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pathsnap-uploads', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['uploads'], 'readwrite');
      const store = transaction.objectStore('uploads');
      const deleteRequest = store.delete(uploadId);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Retry failed upload
async function retryUpload(upload) {
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: upload.data.formData
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
  
  const result = await response.json();
  
  // Notify clients of successful upload
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'UPLOAD_SUCCESS',
        data: result
      });
    });
  });
  
  return result;
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  const options = {
    body: 'A new image has been uploaded to PathSnap!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Images',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('New Upload on PathSnap', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'STORE_UPLOAD':
      storeUpload(data);
      break;
      
    case 'SYNC_UPLOADS':
      syncUploads();
      break;
      
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'upload-sync') {
      event.waitUntil(syncUploads());
    }
  });
}