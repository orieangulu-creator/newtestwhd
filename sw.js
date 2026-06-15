// Service worker: offline support. Precache app shell + content, runtime-cache audio.
var VERSION = 'hi-v7';
var CORE = [
  './', './index.html',
  './css/styles.css',
  './js/app.js', './js/player.js', './js/review.js',
  './data/content-loader.js', './data/content.json',
  './manifest.webmanifest'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (cache) {
      return cache.addAll(CORE).then(function () {
        // try to precache all generated audio (optional; ignore if missing)
        return fetch('audio/manifest.json', { cache: 'no-cache' })
          .then(function (r) { return r.ok ? r.json() : []; })
          .then(function (list) {
            var urls = (list || []).map(function (f) { return 'audio/' + f; });
            return Promise.all(urls.map(function (u) {
              return cache.add(u).catch(function () {});
            }));
          })
          .catch(function () {});
      });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // cache-first, then network, then cache audio at runtime
  e.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
    })
  );
});
