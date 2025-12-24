"use client";

import {formatDistanceToNow} from "date-fns";
import {Calendar, Heart, MessageSquare, ThumbsUp, UserPlus, Users} from "lucide-react";
import Link from "next/link";
import {useCallback, useEffect, useState} from "react";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Card, CardContent} from "@/components/ui/card";
import {createClient} from "@/lib/supabase/client";
import type {Activity} from "@/types/activity";

// Extend the base Activity type with UI-specific properties
interface ActivityWithAuthor extends Activity {
    author_profile: {
        id: string;
        username: string;
        display_name: string | null;
        avatar_url: string | null;
    };
}

interface ActivityFeedProps {
    userId: string;
    mode?: "global" | "profile";
}

export function ActivityFeed({userId, mode = "global"}: ActivityFeedProps) {
    const [activities, setActivities] = useState<ActivityWithAuthor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    const loadActivities = useCallback(async () => {
        let followingIds: string[] = [];

        if (mode === "profile") {
            followingIds = [userId];
        } else {
            // Get user's following list
            const {data: following} = await supabase.from("follows").select("following_id").eq("follower_id", userId);
            followingIds = following?.map((f: { following_id: string }) => f.following_id) || [];
            followingIds.push(userId); // Include own activities
        }

        // Get activities from target users
        const {data} = await supabase
            .from("activities")
            .select("*, author_profile:profiles!inner(id, username, display_name, avatar_url)")
            .in("user_id", followingIds)
            .order("created_at", {ascending: false})
            .limit(20);

        if (data) {
            setActivities(data as ActivityWithAuthor[]);
        }
        setIsLoading(false);
    }, [supabase, userId]);

    useEffect(() => {
        loadActivities();
    }, [loadActivities]);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "like":
                return <Heart className="h-4 w-4 text-red-500"/>;
            case "comment":
                return <MessageSquare className="h-4 w-4 text-royal-blue"/>;
            case "follow":
                return <UserPlus className="h-4 w-4 text-royal-purple"/>;
            case "friend":
                return <ThumbsUp className="h-4 w-4 text-royal-green"/>;
            case "group_join":
                return <Users className="h-4 w-4 text-royal-green"/>;
            case "event_join":
                return <Calendar className="h-4 w-4 text-royal-orange"/>;
            default:
                return <MessageSquare className="h-4 w-4"/>;
        }
    };

    const getActivityText = (activity: Activity) => {
        const displayName = activity.author_profile?.display_name || activity.author_profile?.username || "Someone";

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
                        <span className="font-semibold">{displayName}</span> became friends with someone
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
                        <span className="font-semibold">{displayName}</span> is going to an event
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
            return `/posts/${activity.target_id}`;
        }
        if (activity.target_type === "group" && activity.target_id) {
            return `/groups/${activity.target_id}`;
        }
        if (activity.target_type === "event" && activity.target_id) {
            return `/events/${activity.target_id}`;
        }
        return `/profile/${activity.user_id}`;
    };

    if (isLoading) {
        return (
            <Card className="border-royal-purple/20 bg-card/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                    <p>Loading activities...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {activities.map((activity) => (
                <Link key={activity.id} href={getActivityLink(activity)}>
                    <Card
                        className="border-royal-purple/20 bg-card/50 hover:border-royal-purple/40 transition-all cursor-pointer">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <Avatar className="h-10 w-10 border-2 border-royal-purple/20">
                                    <AvatarImage src={activity.author_profile?.avatar_url || undefined}/>
                                    <AvatarFallback
                                        className="bg-gradient-to-br from-royal-purple to-royal-blue text-white text-sm">
                                        {activity.author_profile?.display_name?.[0]?.toUpperCase() ||
                                            activity.author_profile?.username?.[0]?.toUpperCase() ||
                                            "?"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {getActivityIcon(activity.activity_type)}
                                        <p className="text-sm text-foreground">{getActivityText(activity)}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(activity.created_at), {addSuffix: true})}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
            {activities.length === 0 && (
                <Card className="border-royal-purple/20 bg-card/50">
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <p>No recent activities. Follow more people to see their activities!</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
