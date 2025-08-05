// Service Worker for Quiz Master PWA
const CACHE_NAME = 'quiz-master-v6-with-preloaded-quizzes';
const OFFLINE_URL = 'offline.html';

// Files to cache for offline functionality
const urlsToCache = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/quiz.js',
  './js/storage.js',
  './manifest.json',
  './icon/icon-72x72.png',
  './icon/icon-192x192.svg',
  './icon/icon-512x512.svg',
  './json_dbs/demokratie.json',
  './json_dbs/geschichte.json',
  './json_dbs/elektronik_quiz.json',
  './offline.html'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        // Filter out any chrome-extension URLs that might cause issues
        const filteredUrls = urlsToCache.filter(url => !url.startsWith('chrome-extension:'));
        return cache.addAll(filteredUrls);
      })
      .catch((error) => {
        console.error('Service Worker: Error caching files:', error);
        // Don't fail the install if caching fails
        return Promise.resolve();
      })
  );
  // Force the service worker to activate immediately
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all clients immediately
  return self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip non-HTTP(S) requests (chrome-extension, etc.)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // Clone the request because it's a stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Only cache HTTP/HTTPS requests from the same origin
          if (event.request.url.startsWith(self.location.origin)) {
            // Clone the response because it's a stream
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch((error) => {
                console.warn('Service Worker: Error caching response:', error);
              });
          }
            
          return response;
        }).catch(() => {
          // If both cache and network fail, show offline page for navigation requests
          if (event.request.destination === 'document') {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});

// Handle background sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(
      // Add any background sync logic here
      Promise.resolve()
    );
  }
});

// Handle push notifications (optional for future features)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: './icon/icon-192x192.svg',
      badge: './icon/icon-72x72.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});