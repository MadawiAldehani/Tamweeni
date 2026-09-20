// Tamweeni service worker: makes the app installable and keeps static assets fast.
// HTML, navigations and /api are NEVER cached — a stale page would break the live demo.
const CACHE_VERSION = "tamweeni-v1";

// Content-hashed or rarely changing assets: safe to serve from cache first.
const CACHE_FIRST_PREFIXES = ["/_next/static/", "/icons/", "/fonts/"];
const CACHE_FIRST_EXTENSIONS = [".png", ".svg", ".woff2"];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isCacheFirst(url) {
  return (
    CACHE_FIRST_PREFIXES.some((prefix) => url.pathname.startsWith(prefix)) ||
    CACHE_FIRST_EXTENSIONS.some((ext) => url.pathname.endsWith(ext))
  );
}

function isNetworkOnly(request, url) {
  const accept = request.headers.get("accept") || "";
  return request.mode === "navigate" || accept.includes("text/html") || url.pathname.startsWith("/api");
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(CACHE_VERSION)).put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(CACHE_VERSION)).put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Navigations, HTML and API calls go straight to the network; if offline they simply fail.
  if (isNetworkOnly(request, url)) return;
  event.respondWith(isCacheFirst(url) ? cacheFirst(request) : networkFirst(request));
});
