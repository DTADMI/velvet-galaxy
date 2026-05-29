// Service Worker for caching static assets, API responses, and push notifications
const CACHE_NAME = "velvet_galaxy-cache-v2"
const STATIC_CACHE = "velvet_galaxy-static-v2"

// Static assets to cache immediately
const STATIC_ASSETS = ["/", "/feed", "/discover", "/messages", "/profile", "/download", "/offline", "/manifest.json"]

// Install event - cache static assets
self.addEventListener("install", (event) => {
    console.log("[VGSW] Service Worker installing...")

    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => {
                console.log("[VGSW] Caching static assets")
                return cache.addAll(STATIC_ASSETS.map((url) => new Request(url, { cache: "reload" })))
            })
            .catch((err) => {
                console.error("[VGSW] Failed to cache static assets:", err)
            }),
    )

    // Force the waiting service worker to become the active service worker
    self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
    console.log("[VGSW] Service Worker activating...")

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
                        console.log("[VGSW] Deleting old cache:", cacheName)
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
    const { request } = event
    const url = new URL(request.url)

    // Skip non-GET requests
    if (request.method !== "GET") {
        return
    }

    // Skip chrome extensions and other protocols
    if (!url.protocol.startsWith("http")) {
        return
    }

    // Handle API requests (Supabase) as network-only to avoid stale/private cache risks
    if (url.hostname.includes("supabase")) {
        event.respondWith(fetch(request))
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
                        return caches.match("/offline")
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

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
    console.log("[VGSW] Push received:", event)

    let payload = {
        title: "Velvet Galaxy",
        body: "You have a new notification",
        icon: "/icon-192x192.png",
        badge: "/icon-72x72.png",
        data: {},
    }

    if (event.data) {
        try {
            const data = event.data.json()
            payload = {
                title: data.title || payload.title,
                body: data.body || payload.body,
                icon: data.icon || payload.icon,
                badge: data.badge || payload.badge,
                data: data.data || {},
                tag: data.tag || "velvet-galaxy",
                requireInteraction: data.requireInteraction || false,
                vibrate: data.vibrate || [200, 100, 200],
                timestamp: data.timestamp || Date.now(),
            }
        } catch (e) {
            console.warn("[VGSW] Failed to parse push data:", e)
            payload.body = event.data.text() || payload.body
        }
    }

    const notificationTitle = payload.title
    const options = {
        body: payload.body,
        icon: payload.icon,
        badge: payload.badge,
        data: payload.data,
        tag: payload.tag,
        requireInteraction: payload.requireInteraction,
        vibrate: payload.vibrate,
        timestamp: payload.timestamp,
        actions: [
            { action: "open", title: "Open" },
            { action: "close", title: "Dismiss" },
        ],
    }

    event.waitUntil(self.registration.showNotification(notificationTitle, options))
})

// Notification click event - focus or open a window
self.addEventListener("notificationclick", (event) => {
    console.log("[VGSW] Notification clicked:", event)

    event.notification.close()

    const data = event.notification.data || {}
    let targetUrl = "/notifications"

    if (data.postId) {
        targetUrl = `/post/${data.postId}`
    } else if (data.messageId) {
        targetUrl = `/messages`
    } else if (data.groupId) {
        targetUrl = `/groups`
    } else if (data.profileId) {
        targetUrl = `/profile/${data.profileId}`
    }

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                const clientUrl = new URL(client.url)
                if (clientUrl.pathname === targetUrl && "focus" in client) {
                    return (client as WindowClient).focus()
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl)
            }
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
                    console.log("[VGSW] All caches cleared")
                }),
        )
    }
})
