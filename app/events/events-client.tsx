"use client";

import {format} from "date-fns";
import {Calendar, CheckCircle, Clock, History, MapPin, Plus, Search, Star, TrendingUp, Video} from "lucide-react";
import {useRouter} from "next/navigation";
import type React from "react";
import {useEffect, useState} from "react";

import {LocationAutocomplete} from "@/components/location-autocomplete";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardFooter, CardHeader} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Textarea} from "@/components/ui/textarea";
import {createBrowserClient} from "@/lib/supabase/client";

interface Event {
    id: string
    title: string
    description?: string
    image_url?: string
    location?: string
    start_date: string
    end_date?: string
    is_online: boolean
    going_count: number
    interested_count: number
    user_response?: string
    creator_id?: string
    profiles?: {
        id: string
        username: string
        display_name: string
        avatar_url: string
    }
}

export function EventsClient({userId}: { userId?: string }) {
    const [events, setEvents] = useState<Event[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("upcoming");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        location: "",
        isOnline: false,
        latitude: null as number | null,
        longitude: null as number | null,
    });
    const router = useRouter();
    const supabase = createBrowserClient();

    useEffect(() => {
        loadEvents();
    }, [activeTab, loadEvents]);

    const loadEvents = async () => {
        const now = new Date().toISOString();

        let query = supabase.from("events").select(`
      *,
      profiles!events_creator_id_fkey(id, username, display_name, avatar_url)
    `);

        if (activeTab === "upcoming") {
            query = query.gte("start_date", now);
        } else if (activeTab === "my-events" && userId) {
            const {data: responses} = await supabase
                .from("event_responses")
                .select("event_id")
                .eq("user_id", userId)
                .in("response", ["going", "interested"]);

            if (responses) {
                const eventIds = responses.map((r) => r.event_id);
                query = query.in("id", eventIds);
            }
        } else if (activeTab === "past") {
            query = query.lt("start_date", now);
        }

        const {data} = await query.order("start_date", {ascending: true}).limit(20);

        if (data) {
            const eventsWithCounts = await Promise.all(
                data.map(async (event) => {
                    const {count: goingCount} = await supabase
                        .from("event_responses")
                        .select("id", {count: "exact"})
                        .eq("event_id", event.id)
                        .eq("response", "going");

                    const {count: interestedCount} = await supabase
                        .from("event_responses")
                        .select("id", {count: "exact"})
                        .eq("event_id", event.id)
                        .eq("response", "interested");

                    const {data: userResponse} = await supabase
                        .from("event_responses")
                        .select("response")
                        .eq("event_id", event.id)
                        .eq("user_id", userId || "")
                        .single();

                    return {
                        ...event,
                        going_count: goingCount || 0,
                        interested_count: interestedCount || 0,
                        user_response: userResponse?.response,
                        organizer: event.profiles,
                    };
                }),
            );
            setEvents(eventsWithCounts);
        }
    };

    const respondToEvent = async (eventId: string, response: "going" | "interested" | "not_going") => {
        if (!userId) {
            return;
        }

        const {data: existing} = await supabase
            .from("event_responses")
            .select("id")
            .eq("event_id", eventId)
            .eq("user_id", userId)
            .single();

        if (existing) {
            await supabase.from("event_responses").update({response}).eq("id", existing.id);
        } else {
            await supabase.from("event_responses").insert({event_id: eventId, user_id: userId, response});
        }

        loadEvents();
    };

    const deleteEvent = async (eventId: string) => {
        if (!userId) {
            return;
        }
        if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
            return;
        }

        try {
            // Delete all event responses first
            await supabase.from("event_responses").delete().eq("event_id", eventId);

            // Delete the event
            const {error} = await supabase.from("events").delete().eq("id", eventId);

            if (error) {
                throw error;
            }

            loadEvents();
        } catch (error) {
            console.error("[v0] Error deleting event:", error);
            alert("Failed to delete event");
        }
    };

    const getMinDate = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userId) {
            return;
        }

        // Validate dates
        const start = new Date(newEvent.startDate);
        const end = newEvent.endDate ? new Date(newEvent.endDate) : null;
        const now = new Date();

        if (start < now) {
            alert("Start date cannot be in the past");
            return;
        }

        if (end && end < start) {
            alert("End date cannot be before start date");
            return;
        }

        const {error} = await supabase.from("events").insert({
            title: newEvent.title,
            description: newEvent.description,
            start_date: newEvent.startDate,
            end_date: newEvent.endDate || null,
            location: newEvent.isOnline ? null : newEvent.location || null,
            is_online: newEvent.isOnline,
            creator_id: userId,
        });

        if (error) {
            console.error("Error creating event:", error);
            alert("Failed to create event");
        } else {
            setNewEvent({
                title: "",
                description: "",
                startDate: "",
                endDate: "",
                location: "",
                isOnline: false,
                latitude: null,
                longitude: null,
            });
            setIsCreateDialogOpen(false);
            loadEvents();
        }
    };

    const filteredEvents = events.filter(
        (event) =>
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.location?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                    <Input
                        placeholder="Search events by title, description, or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 h-12 bg-card/50 border-royal-orange/20 focus:border-royal-orange/40"
                    />
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-royal-orange to-amber-600 hover:opacity-90 h-12 px-6">
                            <Plus className="h-5 w-5 mr-2"/>
                            Create Event
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-royal-orange/20 max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl text-gradient">Create New Event</DialogTitle>
                            <DialogDescription>Plan an amazing event for your community</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div>
                                <Label className="text-base">Event Title</Label>
                                <Input
                                    placeholder="Give your event a catchy title"
                                    className="mt-2"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <Label className="text-base">Description</Label>
                                <Textarea
                                    placeholder="What's your event about? What should attendees expect?"
                                    className="mt-2"
                                    rows={4}
                                    value={newEvent.description}
                                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-base">Start Date & Time</Label>
                                    <Input
                                        type="datetime-local"
                                        className="mt-2"
                                        min={getMinDate()}
                                        value={newEvent.startDate}
                                        onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label className="text-base">End Date & Time</Label>
                                    <Input
                                        type="datetime-local"
                                        className="mt-2"
                                        min={newEvent.startDate || getMinDate()}
                                        value={newEvent.endDate}
                                        onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="is-online"
                                    className="rounded"
                                    checked={newEvent.isOnline}
                                    onChange={(e) =>
                                        setNewEvent({
                                            ...newEvent,
                                            isOnline: e.target.checked,
                                            location: e.target.checked ? "" : newEvent.location,
                                        })
                                    }
                                />
                                <Label htmlFor="is-online" className="cursor-pointer text-base">
                                    This is an online event
                                </Label>
                            </div>
                            <div>
                                <Label className="text-base">Location</Label>
                                <LocationAutocomplete
                                    value={newEvent.location}
                                    onChange={(value, coords) =>
                                        setNewEvent({
                                            ...newEvent,
                                            location: value,
                                            latitude: coords?.lat || null,
                                            longitude: coords?.lon || null,
                                        })
                                    }
                                    placeholder={newEvent.isOnline ? "Online event - no location needed" : "Enter city or address"}
                                    disabled={newEvent.isOnline}
                                    className="mt-2"
                                />
                            </div>
                            <Button type="submit"
                                    className="w-full bg-gradient-to-r from-royal-orange to-amber-600 h-11">
                                Create Event
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 bg-card/50 border border-royal-orange/20 h-12">
                    <TabsTrigger value="upcoming" className="text-base">
                        <TrendingUp className="h-4 w-4 mr-2"/>
                        Upcoming
                    </TabsTrigger>
                    <TabsTrigger value="my-events" className="text-base">
                        <Calendar className="h-4 w-4 mr-2"/>
                        My Events
                    </TabsTrigger>
                    <TabsTrigger value="past" className="text-base">
                        <History className="h-4 w-4 mr-2"/>
                        Past
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredEvents.map((event) => (
                            <Card
                                key={event.id}
                                className="overflow-hidden hover:border-royal-orange/50 hover:shadow-lg hover:shadow-royal-orange/10 transition-all bg-card/50 border-royal-orange/20 cursor-pointer group flex flex-col"
                                onClick={() => router.push(`/events/${event.id}`)}
                            >
                                <CardHeader className="p-0">
                                    <div
                                        className="h-48 bg-gradient-to-br from-royal-orange to-amber-600 flex items-center justify-center relative overflow-hidden">
                                        {event.image_url ? (
                                            <img
                                                src={event.image_url || "/placeholder.svg"}
                                                alt={event.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <Calendar
                                                className="h-16 w-16 text-white group-hover:scale-110 transition-transform"/>
                                        )}
                                        {event.is_online && (
                                            <Badge className="absolute top-3 right-3 bg-royal-blue/90 text-white">
                                                <Video className="h-3 w-3 mr-1"/>
                                                Online
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-5 flex-1">
                                    <h3 className="font-bold text-xl mb-2 line-clamp-2 group-hover:text-royal-orange transition-colors">
                                        {event.title}
                                    </h3>
                                    {event.description && (
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                                            {event.description}
                                        </p>
                                    )}
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4 text-royal-orange"/>
                                            <span className="line-clamp-1">
                        {format(new Date(event.start_date), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                                        </div>
                                        {event.location && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="h-4 w-4 text-royal-orange"/>
                                                <span className="line-clamp-1">{event.location}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="secondary"
                                               className="bg-royal-green/10 text-royal-green border-royal-green/20">
                                            <CheckCircle className="h-3 w-3 mr-1"/>
                                            {event.going_count} going
                                        </Badge>
                                        <Badge variant="secondary"
                                               className="bg-royal-purple/10 text-royal-purple border-royal-purple/20">
                                            <Star className="h-3 w-3 mr-1"/>
                                            {event.interested_count} interested
                                        </Badge>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-5 pt-0">
                                    {event.creator_id === userId ? (
                                        <div className="flex gap-2 w-full">
                                            <Button
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/events/${event.id}`);
                                                }}
                                                className="flex-1 bg-gradient-to-r from-royal-purple to-purple-600"
                                            >
                                                Manage
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteEvent(event.id);
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 w-full">
                                            <Button
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    respondToEvent(event.id, "going");
                                                }}
                                                className={
                                                    event.user_response === "going"
                                                        ? "flex-1 bg-gradient-to-r from-royal-green to-emerald-600"
                                                        : "flex-1 bg-card border border-royal-green/30 hover:bg-royal-green/10 text-foreground"
                                                }
                                            >
                                                {event.user_response === "going" ? "Going" : "Going"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    respondToEvent(event.id, "interested");
                                                }}
                                                className={
                                                    event.user_response === "interested"
                                                        ? "flex-1 bg-gradient-to-r from-royal-purple to-purple-600"
                                                        : "flex-1 bg-card border border-royal-purple/30 hover:bg-royal-purple/10 text-foreground"
                                                }
                                            >
                                                Interested
                                            </Button>
                                        </div>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                    {filteredEvents.length === 0 && (
                        <Card className="border-royal-orange/20">
                            <CardContent className="text-center py-16">
                                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground"/>
                                <h3 className="text-xl font-semibold mb-2">No events found</h3>
                                <p className="text-muted-foreground mb-6">
                                    {activeTab === "my-events"
                                        ? "You haven't RSVP'd to any events yet. Explore upcoming events!"
                                        : activeTab === "past"
                                            ? "No past events to display."
                                            : "No upcoming events match your search. Create one to get started!"}
                                </p>
                                {activeTab === "upcoming" && (
                                    <Button
                                        onClick={() => setIsCreateDialogOpen(true)}
                                        className="bg-gradient-to-r from-royal-orange to-amber-600"
                                    >
                                        <Plus className="h-4 w-4 mr-2"/>
                                        Create Your First Event
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
