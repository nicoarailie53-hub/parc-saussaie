// Service Worker for Parc de la Saussaie PWA
// Caches static assets for offline access

const CACHE_NAME = 'parc-saussaie-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './parc.html',
  './manifest.json',
  './favicon.svg',
  './media/societati/icon-192.png',
  './media/societati/icon-512.png',
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

  // Skip cross-origin requests (e.g., APIs, external resources)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip dynamic API/JSON requests
  if (url.pathname.includes('/api/') || url.pathname.endsWith('.json')) {
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).catch(() => {
        // For navigation requests, return the index.html for SPA fallback
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return null;
      });
    })
  );
});
