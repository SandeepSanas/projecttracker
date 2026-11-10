// ProjectTracker service worker.
//
// Makes the app installable AND lets it open with no signal:
//  - The app's own files (page, stylesheet, CSV reader, logo, icons) are
//    fetched from the network first, so a new upload is picked up straight
//    away, and fall back to the saved copy when offline.
//  - The Firebase SDK and fonts are versioned files that never change, so
//    they are served from the saved copy first.
//  - Everything else (Firestore, sign-in, file storage) is left alone — the
//    Firebase SDK does its own offline handling for data.
//
// Bump CACHE_VERSION whenever you upload a new version of the app files.
const CACHE_VERSION = 'v4';
const SHELL_CACHE = `projecttracker-shell-${CACHE_VERSION}`;
const LIB_CACHE = `projecttracker-libs-${CACHE_VERSION}`;

const SHELL_FILES = [
  './',
  './index.html',
  './tailwind.css',
  './papaparse.min.js',
  './logo.jpg',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];
const LIB_FILES = [
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js'
];
const LIB_HOSTS = ['www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL_CACHE);
    // One missing file must not stop the rest from being saved.
    await Promise.all(SHELL_FILES.map((f) => shell.add(new Request(f, { cache: 'reload' })).catch(() => {})));
    const libs = await caches.open(LIB_CACHE);
    await Promise.all(LIB_FILES.map((f) => libs.add(f).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n !== SHELL_CACHE && n !== LIB_CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) cache.put(request, fresh.clone()).catch(() => {});
    return fresh;
  } catch (err) {
    // ignoreSearch: a buyer link (index.html?share=…) still opens offline.
    const saved = await cache.match(request, { ignoreSearch: true });
    if (saved) return saved;
    if (request.mode === 'navigate') {
      const page = await cache.match('./index.html');
      if (page) return page;
    }
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(LIB_CACHE);
  const saved = await cache.match(request);
  if (saved) return saved;
  const fresh = await fetch(request);
  if (fresh && (fresh.ok || fresh.type === 'opaque')) cache.put(request, fresh.clone()).catch(() => {});
  return fresh;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request));
  } else if (LIB_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request));
  }
  // Anything else: not handled here, goes straight to the network.
});
