"use client";

import {format} from "date-fns";
import {Calendar, Clock, MapPin, MessageSquare, Plus, Share2, Video} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useCallback, useEffect, useState} from "react";

import {EventRSVPCard} from "@/components/event-rsvp-card";
import {Navigation} from "@/components/navigation";
import {PostCard} from "@/components/post-card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Textarea} from "@/components/ui/textarea";
import {createBrowserClient} from "@/lib/supabase/client";

interface EventDetailViewProps {
    event: any
    userId: string
}

export function EventDetailView({event, userId}: EventDetailViewProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [userResponse, setUserResponse] = useState<string | null>(null);
    const [goingUsers, setGoingUsers] = useState<any[]>([]);
    const [interestedUsers, setInterestedUsers] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [newPostContent, setNewPostContent] = useState("");
    const [isPostingDiscussion, setIsPostingDiscussion] = useState(false);

    const checkUserResponse = useCallback(async () => {
        const {data} = await supabase
            .from("event_responses")
            .select("response")
            .eq("event_id", event.id)
            .eq("user_id", userId)
            .single();

        if (data) {
            setUserResponse(data.response);
        }
    }, [event.id, userId, supabase]);

    const loadAttendees = useCallback(async () => {
        const {data: going} = await supabase
            .from("event_responses")
            .select("*, profiles(id, display_name, username, avatar_url)")
            .eq("event_id", event.id)
            .eq("response", "going");

        const {data: interested} = await supabase
            .from("event_responses")
            .select("*, profiles(id, display_name, username, avatar_url)")
            .eq("event_id", event.id)
            .eq("response", "interested");

        if (going) {
            setGoingUsers(going);
        }
        if (interested) {
            setInterestedUsers(interested);
        }
    }, [event.id, supabase]);

    const loadPosts = useCallback(async () => {
        const {data} = await supabase
            .from("posts")
            .select("*, profiles(id, username, display_name, avatar_url)")
            .eq("event_id", event.id)
            .order("created_at", {ascending: false});

        if (data) {
            setPosts(data);
        }
    }, [event.id, supabase]);

    const createDiscussionPost = async () => {
        if (!newPostContent.trim()) {
            return;
        }

        setIsPostingDiscussion(true);
        const {data, error} = await supabase
            .from("posts")
            .insert({
                content: newPostContent,
                user_id: userId,
                event_id: event.id,
                media_type: null,
            })
            .select();

        if (!error && data) {
            setNewPostContent("");
            loadPosts();
        }
        setIsPostingDiscussion(false);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: event.title,
                    text: event.description,
                    url: window.location.href,
                });
            } catch {
                console.log("[v0] Share cancelled");
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
    };

    useEffect(() => {
        checkUserResponse();
        loadAttendees();
        loadPosts();
    }, [checkUserResponse, loadAttendees, loadPosts]);

    const canPostDiscussion = userResponse === "going" || event.creator_id === userId;

    return (
        <>
            <Navigation/>
            <div className="min-h-screen bg-background pt-20">
                <div className="container mx-auto max-w-350 px-4 py-6">
                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
                        {/* Event Header Card */}
                        <Card className="border-royal-orange/20 overflow-hidden">
                            <div
                                className="h-80 bg-linear-to-br from-royal-orange to-amber-600 flex items-center justify-center relative">
                                {event.image_url ? (
                                    <img
                                        src={event.image_url || "/placeholder.svg"}
                                        alt={event.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Calendar className="h-32 w-32 text-white"/>
                                )}
                                {event.is_online && (
                                    <Badge className="absolute top-4 right-4 bg-royal-blue/90 text-white">
                                        <Video className="h-4 w-4 mr-1"/>
                                        Online Event
                                    </Badge>
                                )}
                            </div>

                            <CardContent className="p-6 space-y-6">
                                <div>
                                    <h1 className="text-4xl font-bold text-linear mb-4">{event.title}</h1>
                                    {event.profiles && (
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-12 w-12 border-2 border-royal-orange">
                                                <AvatarImage src={event.profiles.avatar_url || undefined}/>
                                                <AvatarFallback
                                                    className="bg-linear-to-br from-royal-orange to-amber-600 text-white">
                                                    {event.profiles.display_name?.[0]?.toUpperCase() ||
                                                        event.profiles.username?.[0]?.toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Hosted by</p>
                                                <Link
                                                    href={`/profile/${event.creator_id}`}
                                                    className="font-semibold text-lg hover:text-royal-orange transition-colors"
                                                >
                                                    {event.profiles.display_name || event.profiles.username}
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Event Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <Clock className="h-5 w-5 text-royal-orange mt-1"/>
                                        <div>
                                            <p className="font-semibold">Start Time</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(event.start_date), "EEEE, MMMM d, yyyy")}
                                            </p>
                                            <p className="text-sm text-muted-foreground">{format(new Date(event.start_date), "h:mm a")}</p>
                                        </div>
                                    </div>
                                    {event.end_date && (
                                        <div className="flex items-start gap-3">
                                            <Clock className="h-5 w-5 text-royal-orange mt-1"/>
                                            <div>
                                                <p className="font-semibold">End Time</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(new Date(event.end_date), "EEEE, MMMM d, yyyy")}
                                                </p>
                                                <p className="text-sm text-muted-foreground">{format(new Date(event.end_date), "h:mm a")}</p>
                                            </div>
                                        </div>
                                    )}
                                    {event.location && (
                                        <div className="flex items-start gap-3 md:col-span-2">
                                            <MapPin className="h-5 w-5 text-royal-orange mt-1"/>
                                            <div>
                                                <p className="font-semibold">Location</p>
                                                <p className="text-sm text-muted-foreground">{event.location}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                {event.description && (
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">About This Event</h3>
                                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{event.description}</p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t border-royal-orange/20">
                                    <Button
                                        onClick={handleShare}
                                        variant="outline"
                                        className="flex-1 border-royal-orange/20 bg-transparent"
                                    >
                                        <Share2 className="h-4 w-4 mr-2"/>
                                        Share Event
                                    </Button>
                                    {event.creator_id === userId && (
                                        <Button
                                            onClick={() => router.push(`/events/${event.id}/edit`)}
                                            className="flex-1 bg-linear-to-r from-royal-purple to-purple-600"
                                        >
                                            Edit Event
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tabs Section */}
                        <Tabs defaultValue="discussion" className="space-y-6">
                            <TabsList className="grid grid-cols-3 bg-card border border-royal-orange/20">
                                <TabsTrigger value="discussion">
                                    <MessageSquare className="h-4 w-4 mr-2"/>
                                    Discussion ({posts.length})
                                </TabsTrigger>
                                <TabsTrigger value="going">Going ({goingUsers.length})</TabsTrigger>
                                <TabsTrigger value="interested">Interested ({interestedUsers.length})</TabsTrigger>
                            </TabsList>

                            <TabsContent value="discussion" className="space-y-4">
                                {canPostDiscussion && (
                                    <Card className="border-royal-orange/20">
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex items-start gap-3">
                                                <Avatar className="h-10 w-10 border-2 border-royal-orange">
                                                    <AvatarImage src={event.profiles?.avatar_url || undefined}/>
                                                    <AvatarFallback
                                                        className="bg-linear-to-br from-royal-orange to-amber-600 text-white">
                                                        {event.profiles?.display_name?.[0]?.toUpperCase() ||
                                                            event.profiles?.username?.[0]?.toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 space-y-2">
                                                    <Textarea
                                                        placeholder="Share your thoughts about this event..."
                                                        value={newPostContent}
                                                        onChange={(e) => setNewPostContent(e.target.value)}
                                                        className="min-h-25 resize-none"
                                                    />
                                                    <div className="flex justify-end">
                                                        <Button
                                                            onClick={createDiscussionPost}
                                                            disabled={!newPostContent.trim() || isPostingDiscussion}
                                                            className="bg-linear-to-r from-royal-orange to-amber-600"
                                                        >
                                                            <Plus className="h-4 w-4 mr-2"/>
                                                            {isPostingDiscussion ? "Posting..." : "Post Discussion"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {posts.map((post) => (
                                    <PostCard key={post.id} post={post}/>
                                ))}
                                {posts.length === 0 && (
                                    <Card className="border-royal-orange/20">
                                        <CardContent className="text-center py-12">
                                            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground"/>
                                            <p className="text-muted-foreground">
                                                No discussions yet.{" "}
                                                {canPostDiscussion ? "Start the conversation!" : "RSVP to join the discussion!"}
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            <TabsContent value="going" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {goingUsers.map((user) => (
                                        <Link key={user.id} href={`/profile/${user.user_id}`}>
                                            <Card
                                                className="border-royal-green/20 hover:border-royal-green/40 transition-colors cursor-pointer">
                                                <CardContent className="p-4 flex items-center gap-3">
                                                    <Avatar className="h-14 w-14 border-2 border-royal-green">
                                                        <AvatarImage src={user.profiles?.avatar_url || undefined}/>
                                                        <AvatarFallback
                                                            className="bg-linear-to-br from-royal-green to-emerald-600 text-white">
                                                            {user.profiles?.display_name?.[0]?.toUpperCase() ||
                                                                user.profiles?.username?.[0]?.toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold text-foreground">
                                                            {user.profiles?.display_name || user.profiles?.username}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">@{user.profiles?.username}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                                {goingUsers.length === 0 && (
                                    <Card className="border-royal-orange/20">
                                        <CardContent className="text-center py-12 text-muted-foreground">
                                            <p>No one is going yet. Be the first!</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            <TabsContent value="interested" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {interestedUsers.map((user) => (
                                        <Link key={user.id} href={`/profile/${user.user_id}`}>
                                            <Card
                                                className="border-royal-purple/20 hover:border-royal-purple/40 transition-colors cursor-pointer">
                                                <CardContent className="p-4 flex items-center gap-3">
                                                    <Avatar className="h-14 w-14 border-2 border-royal-purple">
                                                        <AvatarImage src={user.profiles?.avatar_url || undefined}/>
                                                        <AvatarFallback
                                                            className="bg-linear-to-br from-royal-purple to-purple-600 text-white">
                                                            {user.profiles?.display_name?.[0]?.toUpperCase() ||
                                                                user.profiles?.username?.[0]?.toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold text-foreground">
                                                            {user.profiles?.display_name || user.profiles?.username}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">@{user.profiles?.username}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                                {interestedUsers.length === 0 && (
                                    <Card className="border-royal-orange/20">
                                        <CardContent className="text-center py-12 text-muted-foreground">
                                            <p>No one is interested yet.</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <aside className="hidden lg:block">
                        {event.creator_id !== userId && (
                            <EventRSVPCard
                                eventId={event.id}
                                userId={userId}
                                initialResponse={userResponse}
                                goingCount={goingUsers.length}
                                interestedCount={interestedUsers.length}
                                onResponseChange={() => {
                                    checkUserResponse();
                                    loadAttendees();
                                }}
                            />
                        )}
                    </aside>
                </div>
            </div>
        </>
    );
}
