/**
 * SLEd Service Worker
 * Provides offline caching and PWA functionality
 */

const CACHE_NAME = 'sled-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './manifest.json',
    './Sledlogo.png',
    './SledlogoLight.png',
    './SledlogoDark.png',
    './SledlogoMono.png',
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
    // Google Fonts
    'https://fonts.googleapis.com/css2?family=Fredericka+the+Great&family=Lexend+Deca:wght@300;400;500;600&family=Noto+Sans:wght@300;400;500;600&family=OpenDyslexic:wght@400;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,1,0'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                // Skip waiting to activate immediately
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Failed to cache assets:', error);
            })
    );
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
                        // Check if valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
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
