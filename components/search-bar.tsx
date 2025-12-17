"use client";

import {Search, X} from "lucide-react";
import {useRouter} from "next/navigation";
import {useCallback, useEffect, useState} from "react";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {createClient} from "@/lib/supabase/client";

interface SearchResult {
    users: any[]
    pictures: any[]
    videos: any[]
    audios: any[]
    writings: any[]
    posts: any[]
    events: any[]
    groups: any[]
}

export function SearchBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult>({
        users: [],
        pictures: [],
        videos: [],
        audios: [],
        writings: [],
        posts: [],
        events: [],
        groups: [],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const router = useRouter();

    useEffect(() => {
        if (query.length > 2) {
            performSearch();
        } else {
            setResults({
                users: [],
                pictures: [],
                videos: [],
                audios: [],
                writings: [],
                posts: [],
                events: [],
                groups: [],
            });
        }
    }, [query, performSearch]);

    // Cleanup function for the effect
    useEffect(() => {
        return () => {
            // Any cleanup if needed
        };
    }, []);

    const performSearch = useCallback(async (searchQuery: string = query) => {
        setIsLoading(true);
        const supabase = createClient();

        try {
            // Search users
            const {data: users} = await supabase
                .from("profiles")
                .select("id, username, display_name, avatar_url, bio")
                .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
                .limit(50);

            // Search pictures
            const {data: pictures} = await supabase
                .from("media_items")
                .select("*, profiles(username, display_name, avatar_url)")
                .eq("media_type", "picture")
                .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
                .limit(50);

            // Search videos
            const {data: videos} = await supabase
                .from("media_items")
                .select("*, profiles(username, display_name, avatar_url)")
                .eq("media_type", "video")
                .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
                .limit(50);

            // Search audios
            const {data: audios} = await supabase
                .from("media_items")
                .select("*, profiles(username, display_name, avatar_url)")
                .eq("media_type", "audio")
                .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
                .limit(50);

            // Search writings
            const {data: writings} = await supabase
                .from("media_items")
                .select("*, profiles(username, display_name, avatar_url)")
                .eq("media_type", "writing")
                .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
                .limit(50);

            // Search posts
            const {data: posts} = await supabase
                .from("posts")
                .select("*, profiles(username, display_name, avatar_url)")
                .ilike("content", `%${searchQuery}%`)
                .limit(50);

            // Search events
            const {data: events} = await supabase
                .from("events")
                .select("*, profiles(username, display_name, avatar_url)")
                .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
                .limit(50);

            // Search groups
            const {data: groups} = await supabase
                .from("groups")
                .select("*, profiles(username, display_name, avatar_url)")
                .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
                .limit(50);

            setResults({
                users: users || [],
                pictures: pictures || [],
                videos: videos || [],
                audios: audios || [],
                writings: writings || [],
                posts: posts || [],
                events: events || [],
                groups: groups || [],
            });
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [query]);

    const getTotalResults = () => {
        return (
            results.users.length +
            results.pictures.length +
            results.videos.length +
            results.audios.length +
            results.writings.length +
            results.posts.length +
            results.events.length +
            results.groups.length
        );
    };

    const paginateResults = (items: any[]) => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return items.slice(startIndex, startIndex + itemsPerPage);
    };

    const getTotalPages = (items: any[]) => {
        return Math.ceil(items.length / itemsPerPage);
    };

    return (
        <>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}
                    className="gap-2 hover:bg-royal-purple/10">
                <Search className="h-4 w-4"/>
                <span className="hidden sm:inline">Search</span>
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-gradient">Search Velvet Galaxy</DialogTitle>
                    </DialogHeader>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        <Input
                            placeholder="Search users, media, posts, events, groups..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-10 pr-10"
                        />
                        {query && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setQuery("")}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                            >
                                <X className="h-4 w-4"/>
                            </Button>
                        )}
                    </div>

                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-royal-purple"></div>
                        </div>
                    )}

                    {!isLoading && query.length > 2 && (
                        <Tabs defaultValue="all" className="flex-1 overflow-hidden flex flex-col">
                            <TabsList className="grid grid-cols-5 lg:grid-cols-9 bg-background/50">
                                <TabsTrigger value="all">All ({getTotalResults()})</TabsTrigger>
                                <TabsTrigger value="users">Users ({results.users.length})</TabsTrigger>
                                <TabsTrigger value="pictures">Pictures ({results.pictures.length})</TabsTrigger>
                                <TabsTrigger value="videos">Videos ({results.videos.length})</TabsTrigger>
                                <TabsTrigger value="audios">Audio ({results.audios.length})</TabsTrigger>
                                <TabsTrigger value="writings">Writings ({results.writings.length})</TabsTrigger>
                                <TabsTrigger value="posts">Posts ({results.posts.length})</TabsTrigger>
                                <TabsTrigger value="events">Events ({results.events.length})</TabsTrigger>
                                <TabsTrigger value="groups">Groups ({results.groups.length})</TabsTrigger>
                            </TabsList>

                            <div className="flex-1 overflow-y-auto mt-4">
                                <TabsContent value="all" className="mt-0 space-y-6">
                                    {results.users.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Users</h3>
                                            <div className="space-y-2">
                                                {results.users.slice(0, 3).map((user) => (
                                                    <Card
                                                        key={user.id}
                                                        className="cursor-pointer hover:border-royal-purple/40 transition-all"
                                                        onClick={() => {
                                                            router.push(`/profile/${user.id}`);
                                                            setIsOpen(false);
                                                        }}
                                                    >
                                                        <CardContent className="p-4 flex items-center gap-3">
                                                            <Avatar className="h-10 w-10 ring-2 ring-royal-purple/20">
                                                                <AvatarImage
                                                                    src={user.avatar_url || "/placeholder.svg"}/>
                                                                <AvatarFallback
                                                                    className="bg-gradient-to-br from-royal-auburn to-royal-purple text-white">
                                                                    {(user.display_name || user.username)[0].toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-semibold">{user.display_name || user.username}</p>
                                                                <p className="text-sm text-muted-foreground">@{user.username}</p>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {results.posts.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Posts</h3>
                                            <div className="space-y-2">
                                                {results.posts.slice(0, 3).map((post) => (
                                                    <Card key={post.id}
                                                          className="hover:border-royal-blue/40 transition-all">
                                                        <CardContent className="p-4">
                                                            <div className="flex items-start gap-3">
                                                                <Avatar className="h-8 w-8 ring-2 ring-royal-blue/20">
                                                                    <AvatarImage
                                                                        src={post.profiles?.avatar_url || "/placeholder.svg"}/>
                                                                    <AvatarFallback
                                                                        className="bg-gradient-to-br from-royal-blue to-blue-600 text-white text-xs">
                                                                        {((post.profiles?.display_name || post.profiles?.username) || '?')[0].toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium">
                                                                        {post.profiles?.display_name || post.profiles?.username}
                                                                    </p>
                                                                    <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {results.events.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Events</h3>
                                            <div className="space-y-2">
                                                {results.events.slice(0, 3).map((event) => (
                                                    <Card
                                                        key={event.id}
                                                        className="cursor-pointer hover:border-royal-orange/40 transition-all"
                                                        onClick={() => {
                                                            router.push(`/events`);
                                                            setIsOpen(false);
                                                        }}
                                                    >
                                                        <CardContent className="p-4">
                                                            <p className="font-semibold">{event.title}</p>
                                                            <p className="text-sm text-muted-foreground line-clamp-1">{event.description}</p>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {results.groups.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Groups</h3>
                                            <div className="space-y-2">
                                                {results.groups.slice(0, 3).map((group) => (
                                                    <Card
                                                        key={group.id}
                                                        className="cursor-pointer hover:border-royal-green/40 transition-all"
                                                        onClick={() => {
                                                            router.push(`/groups`);
                                                            setIsOpen(false);
                                                        }}
                                                    >
                                                        <CardContent className="p-4">
                                                            <p className="font-semibold">{group.name}</p>
                                                            <p className="text-sm text-muted-foreground line-clamp-1">{group.description}</p>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="users" className="mt-0">
                                    <div className="space-y-2">
                                        {paginateResults(results.users).map((user) => (
                                            <Card
                                                key={user.id}
                                                className="cursor-pointer hover:border-royal-purple/40 transition-all"
                                                onClick={() => {
                                                    router.push(`/profile/${user.id}`);
                                                    setIsOpen(false);
                                                }}
                                            >
                                                <CardContent className="p-4 flex items-center gap-3">
                                                    <Avatar className="h-12 w-12 ring-2 ring-royal-purple/20">
                                                        <AvatarImage src={user.avatar_url || "/placeholder.svg"}/>
                                                        <AvatarFallback
                                                            className="bg-gradient-to-br from-royal-auburn to-royal-purple text-white">
                                                            {(user.display_name || user.username)[0].toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="font-semibold">{user.display_name || user.username}</p>
                                                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                                                        {user.bio &&
                                                            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{user.bio}</p>}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    {getTotalPages(results.users) > 1 && (
                                        <div className="flex justify-center gap-2 mt-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                Previous
                                            </Button>
                                            <span className="flex items-center px-4 text-sm">
                        Page {currentPage} of {getTotalPages(results.users)}
                      </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage((p) => Math.min(getTotalPages(results.users), p + 1))}
                                                disabled={currentPage === getTotalPages(results.users)}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Similar TabsContent for other types... */}
                                <TabsContent value="posts" className="mt-0">
                                    <div className="space-y-2">
                                        {paginateResults(results.posts).map((post) => (
                                            <Card key={post.id} className="hover:border-royal-blue/40 transition-all">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start gap-3">
                                                        <Avatar className="h-10 w-10 ring-2 ring-royal-blue/20">
                                                            <AvatarImage
                                                                src={post.profiles?.avatar_url || "/placeholder.svg"}/>
                                                            <AvatarFallback
                                                                className="bg-gradient-to-br from-royal-blue to-blue-600 text-white">
                                                                {((post.profiles?.display_name || post.profiles?.username) || '?')[0].toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium">
                                                                {post.profiles?.display_name || post.profiles?.username}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground mt-1">{post.content}</p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="events" className="mt-0">
                                    <div className="space-y-2">
                                        {paginateResults(results.events).map((event) => (
                                            <Card
                                                key={event.id}
                                                className="cursor-pointer hover:border-royal-orange/40 transition-all"
                                                onClick={() => {
                                                    router.push(`/events`);
                                                    setIsOpen(false);
                                                }}
                                            >
                                                <CardContent className="p-4">
                                                    <p className="font-semibold">{event.title}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                                                    {event.location &&
                                                        <p className="text-xs text-muted-foreground mt-2">📍 {event.location}</p>}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="groups" className="mt-0">
                                    <div className="space-y-2">
                                        {paginateResults(results.groups).map((group) => (
                                            <Card
                                                key={group.id}
                                                className="cursor-pointer hover:border-royal-green/40 transition-all"
                                                onClick={() => {
                                                    router.push(`/groups`);
                                                    setIsOpen(false);
                                                }}
                                            >
                                                <CardContent className="p-4">
                                                    <p className="font-semibold">{group.name}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="pictures" className="mt-0">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {paginateResults(results.pictures).map((picture) => (
                                            <Card key={picture.id}
                                                  className="overflow-hidden hover:border-royal-purple/40 transition-all">
                                                <div className="aspect-square bg-muted relative">
                                                    {picture.media_url && (
                                                        <img
                                                            src={picture.media_url || "/placeholder.svg"}
                                                            alt={picture.title}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    )}
                                                </div>
                                                <CardContent className="p-3">
                                                    <p className="text-sm font-medium line-clamp-1">{picture.title}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage
                                                                src={picture.profiles?.avatar_url || "/placeholder.svg"}/>
                                                            <AvatarFallback className="text-xs">
                                                                {((picture.profiles?.display_name || picture.profiles?.username) || '?')[0].toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <p className="text-xs text-muted-foreground">
                                                            {picture.profiles?.display_name || picture.profiles?.username}
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="videos" className="mt-0">
                                    <div className="space-y-2">
                                        {paginateResults(results.videos).map((video) => (
                                            <Card key={video.id}
                                                  className="hover:border-royal-orange/40 transition-all">
                                                <CardContent className="p-4">
                                                    <p className="font-semibold">{video.title}</p>
                                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{video.description}</p>
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage
                                                                src={video.profiles?.avatar_url || "/placeholder.svg"}/>
                                                            <AvatarFallback className="text-xs">
                                                                {((video.profiles?.display_name || video.profiles?.username) || '?')[0].toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <p className="text-xs text-muted-foreground">
                                                            {video.profiles?.display_name || video.profiles?.username}
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="audios" className="mt-0">
                                    <div className="space-y-2">
                                        {paginateResults(results.audios).map((audio) => (
                                            <Card key={audio.id} className="hover:border-royal-blue/40 transition-all">
                                                <CardContent className="p-4">
                                                    <p className="font-semibold">{audio.title}</p>
                                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{audio.description}</p>
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage
                                                                src={audio.profiles?.avatar_url || "/placeholder.svg"}/>
                                                            <AvatarFallback className="text-xs">
                                                                {((audio.profiles?.display_name || audio.profiles?.username) || '?')[0].toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <p className="text-xs text-muted-foreground">
                                                            {audio.profiles?.display_name || audio.profiles?.username}
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="writings" className="mt-0">
                                    <div className="space-y-2">
                                        {paginateResults(results.writings).map((writing) => (
                                            <Card key={writing.id}
                                                  className="hover:border-royal-green/40 transition-all">
                                                <CardContent className="p-4">
                                                    <p className="font-semibold">{writing.title}</p>
                                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                                                        {writing.description || writing.content}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage
                                                                src={writing.profiles?.avatar_url || "/placeholder.svg"}/>
                                                            <AvatarFallback className="text-xs">
                                                                {((writing.profiles?.display_name || writing.profiles?.username) || '?')[0].toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <p className="text-xs text-muted-foreground">
                                                            {writing.profiles?.display_name || writing.profiles?.username}
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    )}

                    {!isLoading && query.length > 2 && getTotalResults() === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No results found for "{query}"</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
