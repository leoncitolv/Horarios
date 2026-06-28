/* Vol turnos · Service Worker PWA independiente */
const APP_VERSION = 'vol-turnos-2.9.1-pwa-20260628';
const STATIC_CACHE = `${APP_VERSION}-static`;
const RUNTIME_CACHE = `${APP_VERSION}-runtime`;
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest-horarios.json',
  './icon-horarios-192.png',
  './icon-horarios-512.png',
  './icon-192.png',
  './icon-512.png'
];
const FIREBASE_MODULES = [
  'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(APP_SHELL);
    await Promise.allSettled(FIREBASE_MODULES.map(async (url) => {
      const response = await fetch(url, { mode: 'cors', cache: 'no-store' });
      if (response && response.ok) await cache.put(url, response.clone());
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => {
      if (!key.startsWith(APP_VERSION)) return caches.delete(key);
    }));
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) await cache.put(request, fresh.clone());
    return fresh;
  } catch (err) {
    const cached = await cache.match(request);
    return cached || caches.match('./index.html');
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const cache = await caches.open(RUNTIME_CACHE);
  const fresh = await fetch(request);
  if (fresh && fresh.ok) await cache.put(request, fresh.clone());
  return fresh;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await caches.match(request);
  const freshPromise = fetch(request).then((fresh) => {
    if (fresh && fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  }).catch(() => null);
  return cached || freshPromise || fetch(request);
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (FIREBASE_MODULES.includes(request.url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
  }
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data.type === 'CHECK_UPDATE') {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => client.postMessage({ type: 'APP_CHECKED', version: APP_VERSION }));
    });
  }
});
