// Service Worker for Parc de la Saussaie PWA
// Caches static assets for offline access

const CACHE_NAME = 'parc-saussaie-v14';

// Static assets to cache
const STATIC_ASSETS = [
  './', './index.html', './parc.html', './manifest.json', './favicon.svg',
  './media/societati/icon-192.png', './media/societati/icon-512.png',
  './media/societati/arcade-rdc-escc.mp4',
  './media/societati/arcade-etaj1-escc.mp4',
  './media/societati/arcade-etaj2-comun.mp4',
  './media/societati/arcade-etaj2-centre-ousswa.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).catch((err) => {
      console.warn('[SW] Some assets failed to cache:', err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip static assets with .mp4 (video) - let them load dynamically
  const urlPath = url.pathname;
  if (urlPath.endsWith('.mp4') || urlPath.endsWith('.jpg') || urlPath.endsWith('.png') || urlPath.endsWith('.svg') || urlPath.endsWith('.ico')) {
    // For media files, use network-first for reliability
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request);
      })
    );
    return;
  }

  // Network-first for index.html (so phones get newest version immediately)
  if (request.mode === 'navigate' || url.pathname === './index.html') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the fresh response for future offline use
          if (response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('./index.html', cloned);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cached version
          return caches.match('./index.html');
        })
    );
    return;
  }

  // Cache-first for other static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return null;
      });
    })
  );
});
