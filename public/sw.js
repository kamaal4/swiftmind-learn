// Hand-written rather than a plugin: the whole course is a few hundred KB of static files,
// so the caching story is small enough to read in one screen.
const CACHE = "swiftmind-v1";

// Derived from where this file was served, so the same worker is correct at a domain root
// and under a GitHub Pages project path with no build-time templating.
// "/swiftmind-learn/sw.js" -> "/swiftmind-learn/", "/sw.js" -> "/"
const BASE = self.location.pathname.replace(/sw\.js$/, "");

// routes.json holds root-relative paths ("/learn/swift"); rebase them onto BASE and add the
// trailing slash the export uses, so the precache list matches real URLs.
const toURL = (route) => (route === "/" ? BASE : `${BASE}${route.replace(/^\//, "")}/`);

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const routes = await (await fetch(`${BASE}routes.json`)).json();
        // Individually, so one failure doesn't abandon the whole precache.
        await Promise.allSettled(routes.map((route) => cache.add(toURL(route))));
      } catch {
        // Offline on first load: the runtime handler below fills the cache later.
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // The /admin editor must always load its current config, and the /oauth login callback
  // carries a GitHub token, which must never be written to the cache.
  if (url.pathname.startsWith(`${BASE}admin/`) || url.pathname.startsWith(`${BASE}oauth/`)) return;

  // Content changes often, so pages are network-first: a cached lesson is the fallback, not
  // the default. Build output under _next/static is content-hashed, so it is cache-first.
  const isStatic = url.pathname.startsWith(`${BASE}_next/static/`);

  event.respondWith(
    isStatic
      ? caches.match(request).then((hit) => hit || fetchAndCache(request))
      : fetchAndCache(request).catch(
          async () => (await caches.match(request)) || (await caches.match(BASE)) || Response.error(),
        ),
  );
});

async function fetchAndCache(request) {
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
  }
  return response;
}
