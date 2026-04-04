const CACHE_NAME = "fincalc-pro-v1";

const ASSETS = [
  "./",
  "./index.html",
  "./ui.css",
  "./logics.js",
  "./manifest.json",
  "./favicon.svg",
  "./icon-192.png", 
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

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

self.addEventListener("fetch", event => {
  if (event.request.url.includes('_vercel/insights')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});


