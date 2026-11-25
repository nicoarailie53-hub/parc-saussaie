const CACHE_NAME = 'parc-saussaie-v19';

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
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(STATIC_ASSETS.map(async (url) => {
      try {
        await cache.add(url);
      } catch (err) {
        console.warn('[SW] skip', url, err);
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.headers.has('range')) return;
  if (url.pathname.endsWith('.mp4')) return;

  event.respondWith((async () => {
    try {
      const fresh = await fetch(request);
      if (fresh && fresh.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, fresh.clone());
      }
      return fresh;
    } catch (err) {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const home = await caches.match('./index.html');
        if (home) return home;
      }
      return new Response('Offline', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=UTF-8' }
      });
    }
  })());
});

