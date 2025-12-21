"use client";

import {Calendar, FileText, ImageIcon, MessageSquare, Music, Search, Users, UsersRound, Video} from "lucide-react";
import Link from "next/link";
import {useRouter, useSearchParams} from "next/navigation";
import type React from "react";
import {useEffect, useState} from "react";

import {Navigation} from "@/components/navigation";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {createBrowserClient} from "@/lib/supabase/client";
import type {MediaItem, SearchResults as SearchResultsType} from "@/types";

interface SearchResultsProps {
    query: string
    type: string
    userId: string
}

export function SearchResults({query: initialQuery, type: initialType, userId}: SearchResultsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(initialQuery);
    const [activeTab, setActiveTab] = useState(initialType);
    const [results, setResults] = useState<SearchResultsType>({
        users: [],
        pictures: [],
        videos: [],
        audios: [],
        writings: [],
        posts: [],
        events: [],
        groups: [],
    });
    const [loading, setLoading] = useState(false);
    const supabase = createBrowserClient();

    useEffect(() => {
        if (query) {
            performSearch();
        }
    }, [query, activeTab]);

    const performSearch = async () => {
        setLoading(true);
        const searchTerm = `%${query}%`;

        // Search users
        const {data: users} = await supabase
            .from("profiles")
            .select("*")
            .or(`display_name.ilike.${searchTerm},username.ilike.${searchTerm},bio.ilike.${searchTerm}`)
            .limit(20);

        // Search media
        const {data: media} = await supabase
            .from("media_items")
            .select("*, author_profile:profiles!inner(display_name, avatar_url)")
            .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
            .limit(20);

        // Search posts
        const {data: posts} = await supabase
            .from("posts")
            .select("*, author_profile:profiles!inner(display_name, avatar_url, username)")
            .ilike("content", searchTerm)
            .limit(20);

        // Search events
        const {data: events} = await supabase
            .from("events")
            .select("*")
            .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
            .limit(20);

        // Search groups
        const {data: groups} = await supabase
            .from("groups")
            .select("*")
            .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
            .limit(20);

        setResults({
            users: users || [],
            pictures: (media as MediaItem[])?.filter((m) => m.media_type === "picture") || [],
            videos: (media as MediaItem[])?.filter((m) => m.media_type === "video") || [],
            audios: (media as MediaItem[])?.filter((m) => m.media_type === "audio") || [],
            writings: (media as MediaItem[])?.filter((m) => m.media_type === "writing") || [],
            posts: posts || [],
            events: events || [],
            groups: groups || [],
        });
        setLoading(false);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/search?q=${encodeURIComponent(query)}&type=${activeTab}`);
    };

    const totalResults =
        results.users.length +
        results.pictures.length +
        results.videos.length +
        results.audios.length +
        results.writings.length +
        results.posts.length +
        results.events.length +
        results.groups.length;

    return (
        <>
            <Navigation/>
            <div className="min-h-screen bg-background pt-20 p-6">
                <div className="max-w-6xl mx-auto">
                    <form onSubmit={handleSearch} className="mb-6">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search SideNet..."
                                    className="pl-10 bg-card border-border"
                                />
                            </div>
                            <Button type="submit" className="bg-gradient-to-r from-royal-blue to-royal-purple">
                                Search
                            </Button>
                        </div>
                    </form>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="grid grid-cols-9 bg-card">
                            <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
                            <TabsTrigger value="users">
                                <Users className="h-4 w-4 mr-1"/>
                                Users
                            </TabsTrigger>
                            <TabsTrigger value="pictures">
                                <ImageIcon className="h-4 w-4 mr-1"/>
                                Pictures
                            </TabsTrigger>
                            <TabsTrigger value="videos">
                                <Video className="h-4 w-4 mr-1"/>
                                Videos
                            </TabsTrigger>
                            <TabsTrigger value="audios">
                                <Music className="h-4 w-4 mr-1"/>
                                Audio
                            </TabsTrigger>
                            <TabsTrigger value="writings">
                                <FileText className="h-4 w-4 mr-1"/>
                                Writings
                            </TabsTrigger>
                            <TabsTrigger value="posts">
                                <MessageSquare className="h-4 w-4 mr-1"/>
                                Posts
                            </TabsTrigger>
                            <TabsTrigger value="events">
                                <Calendar className="h-4 w-4 mr-1"/>
                                Events
                            </TabsTrigger>
                            <TabsTrigger value="groups">
                                <UsersRound className="h-4 w-4 mr-1"/>
                                Groups
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="space-y-8">
                            {(Object.entries(results) as [keyof SearchResultsType, any[]][]).map(
                                ([key, items]) =>
                                    items.length > 0 && (
                                        <div key={key as string}>
                                            <h2 className="text-xl font-bold mb-4 text-foreground capitalize">
                                                {(key as string) === 'pictures' ? 'Photos' :
                                                    (key as string) === 'writings' ? 'Text Posts' :
                                                        (key as string).charAt(0).toUpperCase() + (key as string).slice(1)}
                                            </h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {items.slice(0, 6).map((item) => (
                                                    <ResultCard key={item.id} item={item} type={key as string}/>
                                                ))}
                                            </div>
                                        </div>
                                    ),
                            )}
                            {totalResults === 0 && !loading && (
                                <p className="text-center text-muted-foreground py-12">No results found for
                                    "{query}"</p>
                            )}
                        </TabsContent>

                        {Object.entries(results).map(([key, items]: [string, any[]]) => (
                            <TabsContent key={key} value={key} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {items.map((item) => (
                                        <ResultCard key={item.id} item={item} type={key}/>
                                    ))}
                                </div>
                                {items.length === 0 && !loading && (
                                    <p className="text-center text-muted-foreground py-12">
                                        No {key} found for "{query}"
                                    </p>
                                )}
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            </div>
        </>
    );
}

function ResultCard({item, type}: { item: any; type: string }) {
    const getLink = () => {
        switch (type) {
            case "users":
                return `/profile/${item.id}`;
            case "posts":
                return `/post/${item.id}`;
            case "events":
                return `/events/${item.id}`;
            case "groups":
                return `/groups/${item.id}`;
            default:
                return `/media/${item.id}`;
        }
    };

    return (
        <Link href={getLink()}>
            <Card className="hover:border-royal-purple transition-colors cursor-pointer">
                <CardContent className="p-4">
                    {type === "users" && (
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border-2 border-royal-blue">
                                <AvatarImage src={item.avatar_url || undefined}/>
                                <AvatarFallback
                                    className="bg-gradient-to-br from-royal-blue to-royal-purple text-white">
                                    {item.display_name?.[0]?.toUpperCase() || item.username?.[0]?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-foreground">{item.display_name || item.username}</p>
                                <p className="text-sm text-muted-foreground">@{item.username}</p>
                            </div>
                        </div>
                    )}
                    {(type === "pictures" || type === "videos" || type === "audios" || type === "writings") && (
                        <div>
                            {type === "pictures" && item.media_url && (
                                <img
                                    src={item.media_url || "/placeholder.svg"}
                                    alt={item.title}
                                    className="w-full h-40 object-cover rounded-lg mb-2"
                                />
                            )}
                            <h3 className="font-semibold text-foreground">{item.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                        </div>
                    )}
                    {type === "posts" && (
                        <div>
                            <p className="text-foreground line-clamp-3">{item.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">by {item.profiles?.display_name}</p>
                        </div>
                    )}
                    {(type === "events" || type === "groups") && (
                        <div>
                            <h3 className="font-semibold text-foreground">{item.title || item.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}
