// Service Worker for Parc de la Saussaie PWA
// Network-first strategy for all requests

const CACHE_NAME = 'parc-saussaie-v17';

// Static assets to cache
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

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network-first for index.html (most up-to-date experience)
  if (request.mode === 'navigate' || url.pathname === './index.html') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('./index.html', cloned);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match('./index.html');
        })
    );
    return;
  }

  // Network-first for media files
  if (url.pathname.endsWith('.mp4') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.png') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.ico')) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request);
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
