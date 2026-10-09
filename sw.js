// Service worker: lets the app be installed and open without a connection.
// - the page itself: network first, so a new deploy shows up on the next visit; the cached copy is the offline fallback
// - three.js from jsDelivr: the URL is pinned to 0.160.0 and never changes, so cache first
// Bump VERSION when the list of app files changes.
const VERSION = 'v1';
const CACHE = 'blow-candles-' + VERSION;
const APP = ['./', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'];
const THREE = 'https://cdn.jsdelivr.net/npm/three@0.160.0/';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('blow-candles-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.href.startsWith(THREE)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  if (url.origin !== location.origin) return;
  // pages (with any ?num=…&cake=… query) share one cached copy of the app
  const key = req.mode === 'navigate' ? './' : req;
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
    return res;
  }).catch(() => caches.match(key, { ignoreSearch: true }).then(hit => hit || Response.error())));
});
