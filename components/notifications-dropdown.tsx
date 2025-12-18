"use client";

import {Bell} from "lucide-react";
import Link from "next/link";
import {useEffect, useState} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {createBrowserClient} from "@/lib/supabase/client";

interface Notification {
    id: string
    type: string
    title: string
    message: string
    link?: string
    read: boolean
    from_user_id?: string
    created_at: string
}

export function NotificationsDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const supabase = createBrowserClient();

    useEffect(() => {
        loadNotifications();

        // Subscribe to new notifications
        const channel = supabase
            .channel("notifications")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                },
                () => {
                    loadNotifications();
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const loadNotifications = async () => {
        const {
            data: {user},
        } = await supabase.auth.getUser();
        if (!user) {
            return;
        }

        const {data} = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", {ascending: false})
            .limit(10);

        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter((n: Notification) => !n.read).length);
        }
    };

    const markAsRead = async (notificationId: string) => {
        await supabase.from("notifications").update({read: true}).eq("id", notificationId);
        loadNotifications();
    };

    const markAllAsRead = async () => {
        const {
            data: {user},
        } = await supabase.auth.getUser();
        if (!user) {
            return;
        }

        await supabase.from("notifications").update({read: true}).eq("user_id", user.id).eq("read", false);
        loadNotifications();
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case "follow":
                return "from-royal-blue to-blue-600";
            case "group_invite":
                return "from-royal-green to-emerald-600";
            case "event_invite":
                return "from-royal-orange to-amber-600";
            case "friend_request":
                return "from-royal-purple to-purple-600";
            default:
                return "from-royal-auburn to-red-600";
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5"/>
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-r from-royal-orange to-amber-600 border-0"
                            variant="destructive"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-card border-royal-purple/20">
                <div className="flex items-center justify-between p-3 border-b border-royal-purple/20">
                    <h3 className="font-semibold text-gradient">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                            Mark all read
                        </Button>
                    )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Bell className="h-12 w-12 mx-auto mb-2 opacity-50"/>
                            <p>No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={`p-4 cursor-pointer ${!notification.read ? "bg-royal-purple/5" : ""}`}
                                onClick={() => markAsRead(notification.id)}
                                asChild
                            >
                                <Link href={notification.link || "#"}>
                                    <div className="flex gap-3">
                                        <div
                                            className={`h-10 w-10 rounded-full bg-gradient-to-br ${getNotificationColor(notification.type)} flex items-center justify-center flex-shrink-0`}
                                        >
                                            <Bell className="h-5 w-5 text-white"/>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm mb-1">{notification.title}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(notification.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <div
                                                className="h-2 w-2 rounded-full bg-gradient-to-r from-royal-orange to-amber-600 flex-shrink-0 mt-2"/>
                                        )}
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
