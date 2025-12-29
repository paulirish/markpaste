/**
 * Service Worker for MarkPaste
 *
 * CACHE INVALIDATION:
 * To update assets and invalidate the old cache, increment the version number in CACHE_NAME.
 * The 'activate' event listener will automatically delete old caches that don't match.
 */
const CACHE_NAME = 'markpaste-v1';
const LARGE_ASSETS = [
  '.wasm'
];
const CORE_ASSETS = [
  // '/',
  // '/index.html',
  '/src/style.css',
  '/src/app.js',
  '/src/cleaner.js',
  '/src/converter.js',
  '/src/renderer.js',
  '/src/pandoc.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    console.log('Opened cache');
    // Pre-cache core assets. We don't force cache the large WASM here
    // to keep install fast, it will be cached on first use.
    return cache.addAll(CORE_ASSETS);
  })());
});

self.addEventListener('fetch', (event) => {
  // 1. Handle "only-if-cached" requests (DevTools bug fix)
  if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') return;

  const url = new URL(event.request.url);
  const isLargeAsset = LARGE_ASSETS.some(asset => url.pathname.endsWith(asset));

  event.respondWith((async () => {
    const cachedResponse = await caches.match(event.request);

    if (isLargeAsset) {
      // STRATEGY: Cache-First (for huge files like WASM)
      if (cachedResponse) return cachedResponse;
      return fetchAndCache(event.request);
    } else {
      // STRATEGY: Stale-While-Revalidate (for everything else)
      const fetchPromise = fetchAndCache(event.request);

      // If we found it in cache, return it immediately, fetchPromise updates it in background
      if (cachedResponse) {
        return cachedResponse;
      }
      // Otherwise wait for network
      return fetchPromise;
    }
  })());
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => {
        if (!cacheWhitelist.includes(cacheName)) {
          return caches.delete(cacheName);
        }
      })
    );
  })());
});

async function fetchAndCache(request) {
  const response = await fetch(request);

  // Check for valid response
  if (!response || response.status !== 200 || response.type !== 'basic') {
    return response;
  }

  // Don't cache external resources
  if (new URL(response.url).origin !== self.location.origin) {
    return response;
  }

  // We don't await the cache putting so we don't block the response
  const responseToCache = response.clone();
  caches.open(CACHE_NAME).then((cache) => {
    cache.put(request, responseToCache);
  });

  return response;
}

/**
 * HOW TO DELETE THIS SERVICE WORKER:
 *
 * To programmatically unregister this service worker from the main thread (e.g., in app.js):
 *
 * navigator.serviceWorker.getRegistrations().then(registrations => {
 *   for (let registration of registrations) {
 *     registration.unregister();
 *   }
 * });
 *
 * You can also use 'Clear site data' in the browser DevTools (Application > Storage).
 */
