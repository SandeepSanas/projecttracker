// Minimal service worker — enables "Install app" / Add to Home Screen,
// and caches the app shell so the login screen still loads if offline.
// It deliberately does NOT cache Firebase API calls, so your data is
// always fresh; only the static HTML shell is cached.
const CACHE_NAME = 'projecttracker-shell-v1';
const SHELL_FILES = ['./', './index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle same-origin navigation/document requests with a cache-first
  // fallback; everything else (Firebase, CDNs) goes straight to the network.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
  }
});
