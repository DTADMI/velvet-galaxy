"use client";

import {formatDistanceToNow} from "date-fns";
import {Calendar, Heart, MessageCircle, RefreshCw, ThumbsUp, UserPlus, Users} from "lucide-react";
import Link from "next/link";
import {useCallback, useEffect, useState} from "react";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {createBrowserClient} from "@/lib/supabase/client";

interface Activity {
    id: string
    user_id: string
    activity_type: string
    target_id?: string
    target_type?: string
    content?: string
    created_at: string
    profiles: {
        id: string
        username: string
        display_name: string | null
        avatar_url?: string | null
    }
}

export function ActivityFeed({userId}: { userId: string }) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const supabase = createBrowserClient();

    const loadActivities = useCallback(async () => {
        // Get user's friends and followed users
        const {data: friends} = await supabase
            .from("friendships")
            .select("user_id, friend_id")
            .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
            .eq("status", "accepted");

        const {data: following} = await supabase.from("follows").select("following_id").eq("follower_id", userId);

        const friendIds = new Set<string>();
        friends?.forEach((f) => {
            friendIds.add(f.user_id === userId ? f.friend_id : f.user_id);
        });
        following?.forEach((f) => friendIds.add(f.following_id));

        // Get activities from friends and followed users
        const userIds = Array.from(friendIds);
        if (userIds.length === 0) {
            setLoading(false);
            setRefreshing(false);
            return;
        }

        const {data} = await supabase
            .from("activities")
            .select("*, profiles(id, username, display_name, avatar_url)")
            .in("user_id", userIds)
            .order("created_at", {ascending: false})
            .limit(50);

        if (data) {
            setActivities(data as Activity[]);
        }
        setLoading(false);
        setRefreshing(false);
    }, [supabase, userId]);

    useEffect(() => {
        loadActivities();

        const channel = supabase
            .channel("activities")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "activities",
                },
                () => {
                    loadActivities();
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadActivities, supabase]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadActivities();
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "like":
                return <Heart className="h-4 w-4 text-royal-auburn"/>;
            case "comment":
                return <MessageCircle className="h-4 w-4 text-royal-blue"/>;
            case "follow":
                return <UserPlus className="h-4 w-4 text-royal-purple"/>;
            case "friend":
                return <Users className="h-4 w-4 text-royal-green"/>;
            case "group_join":
                return <Users className="h-4 w-4 text-royal-orange"/>;
            case "event_join":
                return <Calendar className="h-4 w-4 text-royal-orange"/>;
            case "post":
                return <MessageCircle className="h-4 w-4 text-royal-blue"/>;
            default:
                return <ThumbsUp className="h-4 w-4 text-muted-foreground"/>;
        }
    };

    const getActivityText = (activity: Activity) => {
        const displayName = activity.profiles.display_name || activity.profiles.username;
        switch (activity.activity_type) {
            case "post":
                return (
                    <>
                        <span className="font-semibold">{displayName}</span> created a new post
                    </>
                );
            case "like":
                return (
                    <>
                        <span className="font-semibold">{displayName}</span> liked a post
                    </>
                );
            case "comment":
                return (
                    <>
                        <span className="font-semibold">{displayName}</span> commented on a post
                    </>
                );
            case "follow":
                return (
                    <>
                        <span className="font-semibold">{displayName}</span> followed someone
                    </>
                );
            case "friend":
                return (
                    <>
                        <span className="font-semibold">{displayName}</span> made a new friend
                    </>
                );
            case "group_join":
                return (
                    <>
                        <span className="font-semibold">{displayName}</span> joined a group
                    </>
                );
            case "event_join":
                return (
                    <>
                        <span className="font-semibold">{displayName}</span> is attending an event
                    </>
                );
            default:
                return (
                    <>
                        <span className="font-semibold">{displayName}</span> did something
                    </>
                );
        }
    };

    const getActivityLink = (activity: Activity) => {
        if (activity.target_type === "post" && activity.target_id) {
            return `/post/${activity.target_id}`;
        }
        if (activity.target_type === "user" && activity.target_id) {
            return `/profile/${activity.target_id}`;
        }
        if (activity.target_type === "group" && activity.target_id) {
            return `/groups/${activity.target_id}`;
        }
        if (activity.target_type === "event" && activity.target_id) {
            return `/events/${activity.target_id}`;
        }
        return `/profile/${activity.user_id}`;
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <Card key={i} className="border-royal-purple/20 bg-card/50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 animate-pulse">
                                <div className="h-10 w-10 rounded-full bg-muted"/>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-muted rounded w-3/4"/>
                                    <div className="h-3 bg-muted rounded w-1/2"/>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <Card className="border-royal-purple/20 bg-card/50">
                <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">No recent activity from your connections</p>
                    <p className="text-sm text-muted-foreground">Follow more people or make friends to see their
                        activity here</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="border-royal-purple/20 bg-transparent"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}/>
                    Refresh
                </Button>
            </div>
            {activities.map((activity) => (
                <Link key={activity.id} href={getActivityLink(activity)}>
                    <Card
                        className="border-royal-purple/20 bg-card/50 hover:border-royal-purple/40 transition-all cursor-pointer">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <Avatar className="h-10 w-10 ring-2 ring-royal-purple/20">
                                    <AvatarImage src={activity.profiles.avatar_url || undefined}/>
                                    <AvatarFallback
                                        className="bg-gradient-to-br from-royal-purple to-royal-blue text-white">
                                        {(activity.profiles.display_name || activity.profiles.username)[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {getActivityIcon(activity.activity_type)}
                                        <p className="text-sm text-foreground">{getActivityText(activity)}</p>
                                    </div>
                                    {activity.content && (
                                        <div
                                            className="text-sm text-muted-foreground line-clamp-2 mt-1 prose prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{__html: activity.content}}
                                        />
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(new Date(activity.created_at), {addSuffix: true})}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
