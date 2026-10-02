const CACHE_NAME = "meu-convite-static-v2";
const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-192.svg",
  "/icon-512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      // A atualização só assume o controle depois que o usuário confirmar.
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("meu-convite-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

function canCacheStaticAsset(request, url) {
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font"
  ) {
    return url.pathname.startsWith("/_build/") || url.pathname.startsWith("/assets/");
  }
  if (request.destination === "image") {
    return (
      url.pathname.startsWith("/icon-") ||
      url.pathname.startsWith("/media-library/") ||
      url.pathname.startsWith("/convites/") ||
      url.pathname === "/favicon.ico"
    );
  }
  return url.pathname === "/manifest.webmanifest";
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Nunca interceptar páginas autenticadas, convites dinâmicos ou dados do Supabase.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/convite/") ||
    url.pathname.startsWith("/painel") ||
    url.pathname.startsWith("/criar") ||
    url.pathname.startsWith("/cadastro") ||
    url.pathname.startsWith("/login")
  ) {
    return;
  }

  if (canCacheStaticAsset(request, url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      }),
    );
  }
});
