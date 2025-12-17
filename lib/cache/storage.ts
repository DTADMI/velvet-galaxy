import {type DBSchema, type IDBPDatabase, openDB} from "idb";

interface CacheDB extends DBSchema {
    cache: {
        key: string
        value: {
            data: any
            timestamp: number
            ttl: number
        }
    }
    media: {
        key: string
        value: {
            blob: Blob
            timestamp: number
        }
    }
}

class CacheStorage {
    private db: IDBPDatabase<CacheDB> | null = null;
    private dbName = "linknet-cache";
    private version = 1;

    async init() {
        if (this.db) {
            return this.db;
        }

        try {
            this.db = await openDB<CacheDB>(this.dbName, this.version, {
                upgrade(db) {
                    // Create cache store
                    if (!db.objectStoreNames.contains("cache")) {
                        db.createObjectStore("cache");
                    }

                    // Create media store
                    if (!db.objectStoreNames.contains("media")) {
                        db.createObjectStore("media");
                    }
                },
            });

            console.log("[v0] IndexedDB initialized");
            return this.db;
        } catch (error) {
            console.error("[v0] Failed to initialize IndexedDB:", error);
            return null;
        }
    }

    async set(key: string, data: any, ttl: number = 5 * 60 * 1000) {
        const db = await this.init();
        if (!db) {
            return false;
        }

        try {
            await db.put(
                "cache",
                {
                    data,
                    timestamp: Date.now(),
                    ttl,
                },
                key,
            );

            console.log("[v0] Cached data:", key);
            return true;
        } catch (error) {
            console.error("[v0] Failed to cache data:", error);
            return false;
        }
    }

    async get(key: string) {
        const db = await this.init();
        if (!db) {
            return null;
        }

        try {
            const cached = await db.get("cache", key);

            if (!cached) {
                console.log("[v0] Cache miss:", key);
                return null;
            }

            // Check if cache is expired
            const age = Date.now() - cached.timestamp;
            if (age > cached.ttl) {
                console.log("[v0] Cache expired:", key);
                await this.delete(key);
                return null;
            }

            console.log("[v0] Cache hit:", key);
            return cached.data;
        } catch (error) {
            console.error("[v0] Failed to get cached data:", error);
            return null;
        }
    }

    async delete(key: string) {
        const db = await this.init();
        if (!db) {
            return false;
        }

        try {
            await db.delete("cache", key);
            console.log("[v0] Deleted cache:", key);
            return true;
        } catch (error) {
            console.error("[v0] Failed to delete cache:", error);
            return false;
        }
    }

    async clear() {
        const db = await this.init();
        if (!db) {
            return false;
        }

        try {
            await db.clear("cache");
            await db.clear("media");
            console.log("[v0] Cleared all cache");
            return true;
        } catch (error) {
            console.error("[v0] Failed to clear cache:", error);
            return false;
        }
    }

    async setMedia(key: string, blob: Blob) {
        const db = await this.init();
        if (!db) {
            return false;
        }

        try {
            await db.put(
                "media",
                {
                    blob,
                    timestamp: Date.now(),
                },
                key,
            );

            console.log("[v0] Cached media:", key);
            return true;
        } catch (error) {
            console.error("[v0] Failed to cache media:", error);
            return false;
        }
    }

    async getMedia(key: string) {
        const db = await this.init();
        if (!db) {
            return null;
        }

        try {
            const cached = await db.get("media", key);

            if (!cached) {
                console.log("[v0] Media cache miss:", key);
                return null;
            }

            console.log("[v0] Media cache hit:", key);
            return cached.blob;
        } catch (error) {
            console.error("[v0] Failed to get cached media:", error);
            return null;
        }
    }
}

export const cacheStorage = new CacheStorage();
