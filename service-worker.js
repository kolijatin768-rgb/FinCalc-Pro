const CACHE_NAME = "fincalc-pro-v1";

const ASSETS = [
  "./",
  "./main.html",
  "./ui.css",
  "./logics.js",
  "./manifest.json",
  "./favicon.svg",
  "./icons/icon-192.png", // Added: Required for PWA installation
  "./icons/icon-512.png"  // Added: Required for PWA installation
];

// Install Event
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate Event - Clean up old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// Fetch Event - Serve from cache if offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
