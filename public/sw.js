// Service Worker for caching static assets and API responses
const CACHE_NAME = "linknet-cache-v1"
const STATIC_CACHE = "linknet-static-v1"
const API_CACHE = "linknet-api-v1"

// Static assets to cache immediately
const STATIC_ASSETS = ["/", "/feed", "/discover", "/messages", "/profile", "/manifest.json"]

// Install event - cache static assets
self.addEventListener("install", (event) => {
    console.log("[v0] Service Worker installing...")

    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => {
                console.log("[v0] Caching static assets")
                return cache.addAll(STATIC_ASSETS.map((url) => new Request(url, {cache: "reload"})))
            })
            .catch((err) => {
                console.error("[v0] Failed to cache static assets:", err)
            }),
    )

    // Force the waiting service worker to become the active service worker
    self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
    console.log("[v0] Service Worker activating...")

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
                        console.log("[v0] Deleting old cache:", cacheName)
                        return caches.delete(cacheName)
                    }
                }),
            )
        }),
    )

    // Take control of all pages immediately
    return self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
    const {request} = event
    const url = new URL(request.url)

    // Skip non-GET requests
    if (request.method !== "GET") {
        return
    }

    // Skip chrome extensions and other protocols
    if (!url.protocol.startsWith("http")) {
        return
    }

    // Handle API requests (Supabase)
    if (url.hostname.includes("supabase")) {
        event.respondWith(
            caches.open(API_CACHE).then((cache) => {
                return fetch(request)
                    .then((response) => {
                        // Only cache successful responses
                        if (response.status === 200) {
                            cache.put(request, response.clone())
                        }
                        return response
                    })
                    .catch(() => {
                        // Return cached response if network fails
                        return cache.match(request)
                    })
            }),
        )
        return
    }

    // Handle static assets with cache-first strategy
    if (request.destination === "image" || request.destination === "font" || request.destination === "style") {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse
                }

                return fetch(request).then((response) => {
                    if (response.status === 200) {
                        const responseToCache = response.clone()
                        caches.open(STATIC_CACHE).then((cache) => {
                            cache.put(request, responseToCache)
                        })
                    }
                    return response
                })
            }),
        )
        return
    }

    // Handle navigation requests with network-first strategy
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const responseToCache = response.clone()
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache)
                    })
                    return response
                })
                .catch(() => {
                    return caches.match(request).then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse
                        }
                        // Return offline page if available
                        return caches.match("/")
                    })
                }),
        )
        return
    }

    // Default: network-first strategy
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.status === 200) {
                    const responseToCache = response.clone()
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache)
                    })
                }
                return response
            })
            .catch(() => {
                return caches.match(request)
            }),
    )
})

// Handle messages from clients
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting()
    }

    if (event.data && event.data.type === "CLEAR_CACHE") {
        event.waitUntil(
            caches
                .keys()
                .then((cacheNames) => {
                    return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
                })
                .then(() => {
                    console.log("[v0] All caches cleared")
                }),
        )
    }
})
