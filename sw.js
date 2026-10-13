// Offline support. Bump VERSION whenever any cached file changes: the browser
// only notices an update when this file's bytes change, and the page then
// shows the "new version available" banner.
const VERSION = 'v1';
const CACHE = `crosswind-${VERSION}`;
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  // No skipWaiting here: the new version waits until the user taps "Reload".
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('crosswind-') && key !== CACHE)
          .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()));
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

// Cache first, so the app opens instantly and works with no signal.
// Page loads fall back to the cached index.html.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(request).catch(() =>
        request.mode === 'navigate' ? caches.match('./index.html') : Response.error());
    }));
});
