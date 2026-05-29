"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function PushSubscriptionButton() {
    const [status, setStatus] = useState<"idle" | "checking" | "subscribing" | "subscribed" | "unavailable">("checking");
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createBrowserClient();

    useEffect(() => {
        checkStatus();
    }, []);

    async function checkStatus() {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
            setStatus("unavailable");
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setStatus(subscription ? "subscribed" : "idle");
        } catch {
            setStatus("idle");
        }
    }

    async function subscribe() {
        setIsLoading(true);
        setStatus("subscribing");

        try {
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidPublicKey) {
                toast.error("Push notifications are not configured yet");
                setStatus("idle");
                setIsLoading(false);
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any,
            });

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("You must be logged in to enable notifications");
                setStatus("idle");
                setIsLoading(false);
                return;
            }

            const res = await fetch("/api/notifications/push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "subscribe",
                    subscription: subscription.toJSON(),
                }),
            });

            if (res.ok) {
                setStatus("subscribed");
                toast.success("Push notifications enabled");
            } else {
                await subscription.unsubscribe();
                setStatus("idle");
                toast.error("Failed to save push subscription");
            }
        } catch (err: any) {
            console.warn("[VG:Push] Subscription failed:", err);
            setStatus("idle");
            if (err.name === "NotAllowedError") {
                toast.error("Notification permission denied");
            } else {
                toast.error("Failed to enable push notifications");
            }
        } finally {
            setIsLoading(false);
        }
    }

    async function unsubscribe() {
        setIsLoading(true);

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                const res = await fetch("/api/notifications/push", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "unsubscribe",
                        endpoint: subscription.endpoint,
                    }),
                });

                if (res.ok) {
                    setStatus("idle");
                    toast.success("Push notifications disabled");
                }
            }
        } catch {
            toast.error("Failed to disable push notifications");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleToggle() {
        if (status === "subscribed") {
            await unsubscribe();
        } else {
            await subscribe();
        }
    }

    if (status === "unavailable") {
        return null;
    }

    if (status === "checking" || status === "subscribing") {
        return (
            <Button variant="outline" size="sm" disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {status === "subscribing" ? "Enabling..." : "Checking..."}
            </Button>
        );
    }

    return (
        <Button
            variant={status === "subscribed" ? "default" : "outline"}
            size="sm"
            onClick={handleToggle}
            disabled={isLoading}
        >
            {status === "subscribed" ? (
                <>
                    <BellOff className="h-4 w-4 mr-2" />
                    Disable Push
                </>
            ) : (
                <>
                    <Bell className="h-4 w-4 mr-2" />
                    Enable Push
                </>
            )}
        </Button>
    );
}
