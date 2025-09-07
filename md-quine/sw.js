// ----- Quine PWA Service Worker -----
// Bump this to invalidate old caches after deploys:
const VERSION = "v1.0.0";
const PRECACHE = `precache-${VERSION}`;
const RUNTIME = `runtime-${VERSION}`;

// Add core assets you want guaranteed offline:
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon-180.png"
  // Add "./app.js", "./styles.css", fonts, etc. if you have them
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(PRECACHE).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k !== PRECACHE && k !== RUNTIME)
        .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Cache-first for same-origin GETs; network for others.
// Great for static assets and your quine content; tweak as desired.
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return caches.open(RUNTIME).then(cache =>
          fetch(req).then(res => {
            // Don’t cache opaque/error responses
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          }).catch(() => caches.match("./index.html"))
        );
      })
    );
  }
});