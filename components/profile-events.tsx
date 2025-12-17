"use client";

import {format} from "date-fns";
import {CalendarDays, Clock, Globe, Lock, MapPin} from "lucide-react";
import Link from "next/link";
import {useEffect, useState} from "react";

import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import {createClient} from "@/lib/supabase/client";

interface ProfileEventsProps {
    userId: string
}

export function ProfileEvents({userId}: ProfileEventsProps) {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadEvents();
    }, [userId]);

    const loadEvents = async () => {
        setIsLoading(true);
        const supabase = createClient();

        // Get events created by user and events they're attending
        const [createdResult, attendingResult] = await Promise.all([
            supabase.from("events").select("*").eq("creator_id", userId).order("start_date", {ascending: true}),
            supabase
                .from("event_responses")
                .select(`
          *,
          events:event_id (*)
        `)
                .eq("user_id", userId)
                .eq("response", "going"),
        ]);

        const createdEvents = createdResult.data || [];
        const attendingEvents = (attendingResult.data || [])
            .filter((r) => r.events)
            .map((r) => ({...r.events, isAttending: true}));

        // Combine and deduplicate
        const allEventsMap = new Map();
        createdEvents.forEach((e) => allEventsMap.set(e.id, {...e, isCreator: true}));
        attendingEvents.forEach((e) => {
            if (allEventsMap.has(e.id)) {
                allEventsMap.get(e.id).isAttending = true;
            } else {
                allEventsMap.set(e.id, e);
            }
        });

        const sortedEvents = Array.from(allEventsMap.values()).sort(
            (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
        );

        setEvents(sortedEvents);
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <Card className="border-royal-purple/20 bg-card/50">
                <CardContent className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-purple mx-auto"/>
                    <p className="text-muted-foreground mt-4">Loading events...</p>
                </CardContent>
            </Card>
        );
    }

    if (events.length === 0) {
        return (
            <Card className="border-royal-purple/20 bg-card/50">
                <CardContent className="p-12 text-center">
                    <div className="flex justify-center mb-4 text-muted-foreground">
                        <CalendarDays className="h-12 w-12"/>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No events yet</h3>
                    <p className="text-muted-foreground">Create or join your first event to get started!</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-royal-purple/20 bg-card/50">
            <CardContent className="p-6">
                <div className="space-y-4">
                    {events.map((event) => (
                        <Link key={event.id} href={`/events/${event.id}`}>
                            <Card
                                className="border-royal-purple/20 hover:border-royal-purple/40 transition-all cursor-pointer">
                                <CardContent className="p-4">
                                    <div className="flex gap-4">
                                        {event.image_url && (
                                            <img
                                                src={event.image_url || "/placeholder.svg"}
                                                alt={event.title}
                                                className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h3 className="font-semibold text-lg">{event.title}</h3>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {event.is_private ? (
                                                        <Lock className="h-4 w-4 text-muted-foreground"/>
                                                    ) : (
                                                        <Globe className="h-4 w-4 text-muted-foreground"/>
                                                    )}
                                                </div>
                                            </div>
                                            {event.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{event.description}</p>
                                            )}
                                            <div
                                                className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4"/>
                                                    {format(new Date(event.start_date), "PPp")}
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-4 w-4"/>
                                                        {event.location}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                                {event.isCreator && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Creator
                                                    </Badge>
                                                )}
                                                {event.isAttending && !event.isCreator && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Attending
                                                    </Badge>
                                                )}
                                                {event.content_rating === "nsfw" &&
                                                    <Badge className="text-xs bg-red-500">NSFW</Badge>}
                                                {event.is_online && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Online
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
