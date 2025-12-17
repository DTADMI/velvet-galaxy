"use client";

import {Database, RefreshCw, Trash2} from "lucide-react";
import {useEffect, useState} from "react";

import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {cacheUtils} from "@/lib/cache/hooks";
import {cacheStorage} from "@/lib/cache/storage";

export function CacheStatus() {
    const [cacheSize, setCacheSize] = useState<number>(0);
    const [isClearing, setIsClearing] = useState(false);

    useEffect(() => {
        updateCacheSize();
    }, []);

    const updateCacheSize = async () => {
        if ("storage" in navigator && "estimate" in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            setCacheSize(estimate.usage || 0);
        }
    };

    const clearCache = async () => {
        setIsClearing(true);

        // Clear IndexedDB cache
        await cacheStorage.clear();

        // Clear SWR cache
        cacheUtils.invalidateAll();

        // Clear service worker cache
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({type: "CLEAR_CACHE"});
        }

        await updateCacheSize();
        setIsClearing(false);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) {
            return "0 Bytes";
        }
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    return (
        <Card className="p-4 bg-card/50 backdrop-blur border-royal-purple/20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-royal-purple"/>
                    <div>
                        <p className="text-sm font-medium">Cache Storage</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(cacheSize)} used</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={updateCacheSize} className="gap-2 bg-transparent">
                        <RefreshCw className="h-4 w-4"/>
                        Refresh
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearCache}
                        disabled={isClearing}
                        className="gap-2 text-destructive hover:text-destructive bg-transparent"
                    >
                        <Trash2 className="h-4 w-4"/>
                        Clear Cache
                    </Button>
                </div>
            </div>
        </Card>
    );
}
