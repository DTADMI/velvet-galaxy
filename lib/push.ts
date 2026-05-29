import "server-only";

let webpush: any = null;

async function getWebPush() {
    if (webpush) return webpush;
    try {
        webpush = await import("web-push");
    } catch {
        return null;
    }
    return webpush;
}

let vapidInitialized = false;

async function ensureVapid() {
    if (vapidInitialized) return true;
    const wp = await getWebPush();
    if (!wp) return false;

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidEmail = process.env.VAPID_EMAIL || "admin@velvetgalaxy.app";

    if (!vapidPublicKey || !vapidPrivateKey) {
        console.warn("[VG:Push] VAPID keys not configured");
        return false;
    }

    wp.setVapidDetails(`mailto:${vapidEmail}`, vapidPublicKey, vapidPrivateKey);
    vapidInitialized = true;
    return true;
}

export interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export async function sendPushNotification(
    subscription: PushSubscription,
    payload: { title: string; body: string; icon?: string; badge?: string; data?: Record<string, any>; tag?: string }
): Promise<boolean> {
    const ready = await ensureVapid();
    if (!ready) return false;

    try {
        const wp = await getWebPush();
        if (!wp) return false;

        await wp.sendNotification(
            {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                },
            },
            JSON.stringify({
                title: payload.title,
                body: payload.body,
                icon: payload.icon || "/icon-192x192.png",
                badge: payload.badge || "/icon-72x72.png",
                data: payload.data || {},
                tag: payload.tag || "velvet-galaxy",
                requireInteraction: false,
                vibrate: [200, 100, 200],
                timestamp: Date.now(),
            })
        );
        return true;
    } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
            return false;
        }
        console.warn("[VG:Push] Failed to send notification:", err.message);
        return false;
    }
}

export async function sendPushToUser(
    userId: string,
    notification: { title: string; body: string; data?: Record<string, any> }
): Promise<number> {
    const { createServerClient } = await import("@/lib/supabase/server");
    const supabase = await createServerClient();

    const { data: subscriptions, error } = await supabase
        .from("push_subscriptions")
        .select("subscription")
        .eq("user_id", userId)
        .eq("active", true);

    if (error || !subscriptions || subscriptions.length === 0) return 0;

    let sent = 0;
    for (const row of subscriptions) {
        const sub = row.subscription as unknown as PushSubscription;
        const ok = await sendPushNotification(sub, {
            title: notification.title,
            body: notification.body,
            data: notification.data,
        });

        if (ok) {
            sent++;
        } else {
            await supabase
                .from("push_subscriptions")
                .update({ active: false, deactivated_at: new Date().toISOString() })
                .eq("user_id", userId)
                .eq("subscription->>endpoint", sub.endpoint);
        }
    }

    return sent;
}

export async function sendPushToUsers(
    userIds: string[],
    notification: { title: string; body: string; data?: Record<string, any> }
): Promise<number> {
    let total = 0;
    for (const userId of userIds) {
        total += await sendPushToUser(userId, notification);
    }
    return total;
}

export function getVapidPublicKey(): string | null {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}
