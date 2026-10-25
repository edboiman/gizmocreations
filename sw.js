'use strict';
// Bump VERSION and every ?v= asset reference together when releasing app changes.
const VERSION = '3.1';
const PREFIX = 'bow-purl:' + new URL(self.registration.scope).pathname + ':';
const CACHE = PREFIX + VERSION;
const CORE = [ './', './index.html', './style.css?v=3.1', './motifs.js?v=3.1', './llm.js?v=3.1', './app.js?v=3.1', './yarns.js?v=3.1', './seasonal.js?v=3.1', './cats.js?v=3.1', './offline.js?v=3.1', './manifest.webmanifest', './images/studio-icon.svg', './images/icon-192.png', './images/icon-512.png', ...['cats-tree','cat-portrait','cats-bed','cat-peek','cat-nap','cat-yawn'].map(n => './images/' + n + '.jpg?v=3.1') ];
const CORE_URLS = new Set(CORE.map(p => new URL(p, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try { await cache.addAll(CORE.map(p => new Request(new URL(p, self.registration.scope), { cache: 'reload' }))); }
    catch (error) { await caches.delete(CACHE); throw error; }
    // The new release takes control after existing app tabs are closed.
  })());
});
self.addEventListener('activate', event => event.waitUntil((async () => {
  const names = await caches.keys();
  await Promise.all(names.filter(n => n.startsWith(PREFIX) && n !== CACHE).map(n => caches.delete(n)));
  await self.clients.claim();
})()));
self.addEventListener('message', event => {
  if (event.data?.type === 'OFFLINE_STATUS') event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const entries = await Promise.all(CORE.map(p => cache.match(new URL(p, self.registration.scope))));
    event.ports[0]?.postMessage({ offlineReady: entries.every(Boolean) });
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  // Only cache the authored app shell. Never store connector replies or external photos.
  const home = url.pathname === new URL(self.registration.scope).pathname || url.pathname === new URL('index.html', self.registration.scope).pathname;
  if (event.request.mode === 'navigate' && home) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(new URL('./index.html', self.registration.scope))) || fetch(event.request)));
  } else if (CORE_URLS.has(url.href)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(event.request)) || fetch(event.request)));
  }
});
