// Minimal service worker — exists to make the app properly installable
// (not just a bookmark shortcut). Chrome specifically requires a service
// worker with a "fetch" event handler present for the full "Install App"
// experience to be offered — without one, it falls back to a basic
// shortcut, which is what was happening before this was added.
//
// This handler is a pure pass-through: every request still goes straight
// to the network, nothing is cached. That's deliberate — it satisfies the
// installability requirement without risking ever serving stale content.
const CACHE_NAME = 'projecttracker-v3';

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
