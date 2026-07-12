/* ==========================================
   AntigravityCut - Service Worker
   Caches app shell for offline support & PWA install
   ========================================== */

const CACHE_NAME = 'antigravity-cut-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/assets.js',
  '/timeline.js',
  '/renderer.js',
  '/exporter.js',
  '/firebase-db.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install: cache all static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: network-first for API calls, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always go to network for cross-origin requests (Firebase, CDN, APIs)
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Update cache with fresh response
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, cloned);
        });
        return response;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Fallback to index.html for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
