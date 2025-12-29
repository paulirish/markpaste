/**
 * Service Worker for MarkPaste
 *
 * CACHE INVALIDATION:
 * To update assets and invalidate the old cache, increment the version number in CACHE_NAME.
 * The 'activate' event listener will automatically delete old caches that don't match.
 */
const CACHE_NAME = 'markpaste-v1';

const ASSETS = [
  // '/',
  // '/index.html',
  '/src/style.css',
  '/src/app.js',
  '/src/cleaner.js',
  '/src/converter.js',
  '/src/renderer.js',
  '/src/pandoc.js',
  '/third_party/pandoc.wasm'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(ASSETS);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Cache-first strategy for the large WASM file and other static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                 if (event.request.url.startsWith(self.location.origin)) {
                     cache.put(event.request, responseToCache);
                 }
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

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
