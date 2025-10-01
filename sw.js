const VERSION = 'ifrit-sw-v1-' + Date.now();
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.webmanifest',
  './assets/logo-meteor.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Network-first for navigation; cache-first for static assets
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // For navigations, try network first, fallback to cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // For other requests, prefer cache then network
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        // Update in background
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(req, copy));
        }).catch(() => {});
        return cached;
      }
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => cached);
    })
  );
});
