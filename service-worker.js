// Minimal service worker — exists only to make the app installable
// (Chrome/Android requires one). It deliberately does NOT cache index.html
// or any app data, so every load always gets the latest version from
// GitHub Pages — no stale-cache surprises after you push an update.
const CACHE_NAME = 'projecttracker-v2';

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))))
  );
  self.clients.claim();
});

// No fetch handler — all requests go straight to the network as normal.
// This keeps the app installable without risking stale content.
