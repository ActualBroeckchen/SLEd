/**
 * SLEd Service Worker
 * Provides offline caching and PWA functionality
 */

const CACHE_NAME = 'sled-v4';

// Precache only same-origin assets we control. Google Fonts CSS + font
// files are cached opportunistically by the fetch handler on first use —
// putting them here would risk the whole addAll rejecting if any one URL
// hiccups, since addAll is atomic.
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './manifest.json',
    './Sledlogo.png',
    './SledlogoLight.png',
    './SledlogoDark.png',
    './SledlogoMono.png',
    // Self-hosted OpenDyslexic (not available on Google Fonts)
    './fonts/opendyslexic-400-normal.woff2',
    './fonts/opendyslexic-700-normal.woff2',
    // JavaScript modules
    './js/main.js',
    './js/state.js',
    './js/elements.js',
    './js/utils.js',
    './js/ui.js',
    './js/entries.js',
    './js/tabs.js',
    './js/sidebar.js',
    './js/search.js',
    './js/file-io.js',
    './js/form-template.js',
    './js/script-import.js'
];

// Install event - precache local assets resiliently (one bad URL doesn't
// take down the install; addAll would have rejected the whole batch).
self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        const results = await Promise.allSettled(
            ASSETS_TO_CACHE.map((url) => cache.add(url))
        );
        const failed = results
            .map((r, i) => (r.status === 'rejected' ? ASSETS_TO_CACHE[i] : null))
            .filter(Boolean);
        if (failed.length) {
            console.warn('Service worker: some assets failed to precache:', failed);
        }
        await self.skipWaiting();
    })());
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                // Take control of all pages immediately
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http(s) requests
    if (!request.url.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached response
                    return cachedResponse;
                }
                
                // Fetch from network
                return fetch(request)
                    .then((networkResponse) => {
                        // Cache successful same-origin (basic) AND cross-origin
                        // (cors) responses. The old check excluded type !== 'basic'
                        // which silently skipped Google Fonts CSS / font files
                        // — they came back as 'cors' and never got cached, so
                        // the app needed network to render fonts every visit.
                        // Opaque responses (status 0, length 0) still excluded
                        // because they can't be reused reliably.
                        const cacheable = networkResponse
                            && networkResponse.status === 200
                            && (networkResponse.type === 'basic' || networkResponse.type === 'cors');
                        if (!cacheable) {
                            return networkResponse;
                        }

                        // Clone the response for caching
                        const responseToCache = networkResponse.clone();

                        // Cache the fetched response (for fonts and other dynamic assets)
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch(() => {
                        // If both cache and network fail, show offline page for navigation requests
                        if (request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                        
                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
