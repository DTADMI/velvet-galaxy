"use client";

import {formatDistanceToNow} from "date-fns";
import {Bell, BellOff, Heart, Loader2, MessageCircle, UserPlus, Users} from "lucide-react";
import Link from "next/link";
import {useCallback, useEffect, useState} from "react";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {createClient} from "@/lib/supabase/client";
import {cn} from "@/lib/utils";

interface NotificationsClientProps {
    profile: any
    initialNotifications: any[]
}

export function NotificationsClient({profile, initialNotifications}: NotificationsClientProps) {
    const [notifications, setNotifications] = useState(initialNotifications);
    const [mounted, setMounted] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(initialNotifications.length === 50);
    const supabase = createClient();

    useEffect(() => {
        setMounted(true);
    }, []);

    const markAsRead = async (notificationId: string) => {
        await supabase.from("notifications").update({read: true}).eq("id", notificationId);

        setNotifications((prev) => prev.map((n) => (n.id === notificationId ? {...n, read: true} : n)));
    };

    const markAllAsRead = async () => {
        await supabase.from("notifications").update({read: true}).eq("user_id", profile.id).eq("read", false);

        setNotifications((prev) => prev.map((n) => ({...n, read: true})));
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "like":
                return <Heart className="h-4 w-4 text-red-500"/>;
            case "comment":
                return <MessageCircle className="h-4 w-4 text-blue-500"/>;
            case "follow":
                return <UserPlus className="h-4 w-4 text-green-500"/>;
            case "mention":
                return <MessageCircle className="h-4 w-4 text-purple-500"/>;
            case "group":
                return <Users className="h-4 w-4 text-orange-500"/>;
            default:
                return <Bell className="h-4 w-4 text-muted-foreground"/>;
        }
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore || notifications.length === 0) {
            return;
        }
        setIsLoadingMore(true);

        try {
            const last = notifications[notifications.length - 1];
            const lastCreatedAt = last?.created_at;
            const {data, error} = await supabase
                .from("notifications")
                .select("*, from_user:profiles!notifications_from_user_id_fkey(id, username, display_name, avatar_url)")
                .eq("user_id", profile.id)
                .lt("created_at", lastCreatedAt)
                .order("created_at", {ascending: false})
                .limit(50);

            if (error) {
                console.error("loadMore notifications error", error);
            }

            if (data && data.length > 0) {
                setNotifications((prev) => [...prev, ...data]);
                setHasMore(data.length === 50);
            } else {
                setHasMore(false);
            }
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasMore, isLoadingMore, notifications, profile.id, supabase]);

    if (!mounted) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-royal-purple"/>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-royal-purple/5">
            <div className="container mx-auto max-w-5xl p-4">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                    {/* Main Notifications Feed */}
                    <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h1 className="text-3xl font-bold text-gradient">Notifications</h1>
                            {unreadCount > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={markAllAsRead}
                                    className="border-royal-purple/30 hover:bg-royal-purple/10 bg-transparent"
                                >
                                    Mark all as read
                                </Button>
                            )}
                        </div>

                        {/* Push Notification Prompt */}
                        <Card
                            className="border-royal-purple/30 bg-gradient-to-br from-royal-purple/10 to-royal-blue/10 backdrop-blur-sm shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-full bg-royal-purple/20">
                                        <Bell className="h-6 w-6 text-royal-purple"/>
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <h3 className="font-semibold text-lg">Enable Push Notifications</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Get real-time updates for private messages, notifications, and friend
                                            requests on this device.
                                        </p>
                                        <div className="flex gap-2">
                                            <Button className="bg-royal-purple hover:bg-royal-purple/90">Enable</Button>
                                            <Button variant="ghost">Later</Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notifications List */}
                        <div className="space-y-2">
                            {notifications.map((notification) => (
                                <Card
                                    key={notification.id}
                                    className={cn(
                                        "border-royal-purple/30 backdrop-blur-sm shadow-sm transition-all hover:shadow-md cursor-pointer",
                                        notification.read ? "bg-card/60" : "bg-card/90 border-royal-purple/50",
                                    )}
                                    onClick={() => {
                                        if (!notification.read) {
                                            markAsRead(notification.id);
                                        }
                                        if (notification.link) {
                                            window.location.href = notification.link;
                                        }
                                    }}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            {/* User Avatar */}
                                            {notification.from_user && (
                                                <Link
                                                    href={`/profile/${notification.from_user.id}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex-shrink-0"
                                                >
                                                    <Avatar className="h-12 w-12 border-2 border-royal-purple/30">
                                                        <AvatarImage
                                                            src={notification.from_user.avatar_url || undefined}
                                                            alt={notification.from_user.display_name || notification.from_user.username}
                                                        />
                                                        <AvatarFallback
                                                            className="bg-gradient-to-br from-royal-purple to-royal-blue text-white">
                                                            {(notification.from_user.display_name ||
                                                                notification.from_user.username)[0].toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </Link>
                                            )}

                                            {/* Notification Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-2">
                                                    <div className="flex-1">
                                                        <p className="text-sm">
                                                            {notification.from_user && (
                                                                <Link
                                                                    href={`/profile/${notification.from_user.id}`}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="font-semibold text-royal-purple hover:underline"
                                                                >
                                                                    {notification.from_user.display_name || notification.from_user.username}
                                                                </Link>
                                                            )}{" "}
                                                            <span
                                                                className="text-muted-foreground">{notification.message}</span>
                                                        </p>
                                                        {notification.title && (
                                                            <p className="text-sm font-medium mt-1 text-foreground">{notification.title}</p>
                                                        )}
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {formatDistanceToNow(new Date(notification.created_at), {addSuffix: true})}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {getNotificationIcon(notification.type)}
                                                        {!notification.read && (
                                                            <div
                                                                className="h-2 w-2 rounded-full bg-royal-purple animate-pulse"/>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Thumbnail (if applicable) */}
                                            {notification.link && notification.link.includes("/media/") && (
                                                <div className="flex-shrink-0">
                                                    <div
                                                        className="h-16 w-16 rounded-lg bg-gradient-to-br from-royal-purple/20 to-royal-blue/20 border border-royal-purple/30"/>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {notifications.length > 0 && hasMore && (
                                <div className="flex justify-center py-4">
                                    <Button
                                        variant="outline"
                                        className="border-royal-purple/30 hover:bg-royal-purple/10"
                                        onClick={loadMore}
                                        disabled={isLoadingMore}
                                    >
                                        {isLoadingMore ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                                Loading more
                                            </>
                                        ) : (
                                            "Load more"
                                        )}
                                    </Button>
                                </div>
                            )}

                            {notifications.length === 0 && (
                                <Card className="border-royal-purple/30 bg-card/80 backdrop-blur-sm shadow-lg">
                                    <CardContent className="p-12 text-center">
                                        <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                                        <h3 className="font-semibold text-lg mb-2">No notifications yet</h3>
                                        <p className="text-sm text-muted-foreground">
                                            When someone interacts with your content, you'll see it here
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-4">
                        {/* Info Card */}
                        <Card className="border-royal-purple/30 bg-card/80 backdrop-blur-sm shadow-lg">
                            <CardContent className="p-4 space-y-3">
                                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                                    What am I notified about?
                                </h3>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <p>You will be notified when someone:</p>
                                    <ul className="space-y-1 ml-4">
                                        <li className="flex items-start gap-2">
                                            <span className="text-royal-purple">•</span>
                                            <span>Comments or likes one of your posts, photos, videos, or writings</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-royal-purple">•</span>
                                            <span>Mentions you</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-royal-purple">•</span>
                                            <span>Follows you</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-royal-purple">•</span>
                                            <span>Accepts your friend request</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-royal-purple">•</span>
                                            <span>Changes their relationship status with you</span>
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Advertisement */}
                        <Card
                            className="border-royal-purple/30 bg-gradient-to-br from-royal-purple/10 to-royal-blue/10 backdrop-blur-sm shadow-lg">
                            <CardContent className="p-4 space-y-3">
                                <div
                                    className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Advertisement
                                </div>
                                <div
                                    className="aspect-square bg-gradient-to-br from-royal-purple/20 to-royal-blue/20 rounded-lg flex items-center justify-center">
                                    <p className="text-sm text-muted-foreground">Ad Space</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="font-semibold text-sm">Premium Features</p>
                                    <p className="text-xs text-muted-foreground">Upgrade for exclusive benefits</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notification Settings */}
                        <Card className="border-royal-purple/30 bg-card/80 backdrop-blur-sm shadow-lg">
                            <CardContent className="p-4 space-y-3">
                                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                                    Notification Settings
                                </h3>
                                <Link href="/settings?tab=notifications">
                                    <Button
                                        variant="outline"
                                        className="w-full border-royal-purple/30 hover:bg-royal-purple/10 bg-transparent"
                                    >
                                        Manage Preferences
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
