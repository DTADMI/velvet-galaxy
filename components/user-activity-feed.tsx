"use client";

import {formatDistanceToNow} from "date-fns";
import {Calendar, FileText, Heart, MessageSquare, ThumbsUp, UserPlus, Users} from "lucide-react";
import Link from "next/link";
import {useEffect, useState} from "react";

import {Card, CardContent} from "@/components/ui/card";
import {createClient} from "@/lib/supabase/client";

interface Activity {
    id: string
    user_id: string
    activity_type: string
    target_id: string | null
    target_type: string | null
    metadata: any
    created_at: string
}

export function UserActivityFeed({userId}: { userId: string }) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadActivities();

        // Subscribe to real-time updates
        const channel = supabase
            .channel(`user_activities_${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "activities",
                    filter: `user_id=eq.${userId}`,
                },
                (payload: any) => {
                    setActivities((prev) => [payload.new as Activity, ...prev]);
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    const loadActivities = async () => {
        const {data} = await supabase
            .from("activities")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", {ascending: false})
            .limit(50);

        if (data) {
            setActivities(data as Activity[]);
        }
        setIsLoading(false);
    };

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
            case "post":
                return <FileText className="h-4 w-4 text-royal-blue"/>;
            default:
                return <MessageSquare className="h-4 w-4"/>;
        }
    };

    const getActivityText = (activity: Activity) => {
        switch (activity.activity_type) {
            case "post":
                return "Created a new post";
            case "like":
                return "Liked a post";
            case "comment":
                return "Commented on a post";
            case "follow":
                return "Followed a user";
            case "friend":
                return "Became friends with someone";
            case "group_join":
                return "Joined a group";
            case "event_join":
                return "RSVP'd to an event";
            default:
                return "Did something";
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
        if (activity.target_type === "user" && activity.target_id) {
            return `/profile/${activity.target_id}`;
        }
        return "#";
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
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-royal-purple to-royal-blue">
                                    {getActivityIcon(activity.activity_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground font-medium">{getActivityText(activity)}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
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
                        <p>No recent activities yet</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
