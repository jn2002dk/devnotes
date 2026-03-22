const SHELL_CACHE = "devnotes-shell-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      cache.addAll(["/", "/manifest.webmanifest", "/icon.svg"])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.protocol !== "http:" && requestUrl.protocol !== "https:") {
    return;
  }

  if (requestUrl.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          if (!response.ok || requestUrl.origin !== self.location.origin) {
            return response;
          }

          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, copy).catch(() => undefined));
          return response;
        })
        .catch(() => caches.match("/"));
    })
  );
});