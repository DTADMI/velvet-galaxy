"use client";

import {
    Compass,
    Eye,
    EyeOff,
    FileText,
    Filter,
    Heart,
    ImageIcon,
    Loader2,
    MapPin,
    Megaphone,
    Music,
    Sparkles,
    TrendingUp,
    Video,
} from "lucide-react";
import {useCallback, useEffect, useState} from "react";

import {MasonryGrid} from "@/components/masonry-grid";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Checkbox} from "@/components/ui/checkbox";
import {Label} from "@/components/ui/label";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {createClient} from "@/lib/supabase/client";
import {cn} from "@/lib/utils";
import {useFeatureFlag} from "@/hooks/use-feature-flag";

interface DiscoverClientProps {
    profile: {
        id: string
        username: string
        display_name: string | null
        avatar_url: string | null
        location: string | null
    }
    _likedTags: Array<{
        tag_id: string
        tags: { name: string } | null
    }>
}

export function DiscoverClient({profile, _likedTags}: DiscoverClientProps) {
    const [activeTab, setActiveTab] = useState("popular");
    const [curatedPosts, setCuratedPosts] = useState<any[]>([]);
    const [popularPosts, setPopularPosts] = useState<any[]>([]);
    const [likedPosts, setLikedPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [feedMode, setFeedMode] = useState<"sfw" | "all">("sfw");
    const [localOnly, setLocalOnly] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lon: number } | null>(null);
    const {isEnabled: isRecommendationsEnabled, isLoading: isFlagsLoading} = useFeatureFlag("ai_recommendations");
    const {isEnabled: isLocalizedEnabled} = useFeatureFlag("localized_discovery");

    useEffect(() => {
        if (!isFlagsLoading && isRecommendationsEnabled) {
            setActiveTab("curated");
        }
    }, [isFlagsLoading, isRecommendationsEnabled]);
    const [contentFilters, setContentFilters] = useState({
        image: true,
        video: true,
        audio: true,
        writing: true,
        text: true,
        promotional: false,
    });

    useEffect(() => {
        const fetchLocation = async () => {
            const supabase = createClient();
            const {data} = await supabase.from("profiles").select("latitude, longitude").eq("id", profile.id).single();
            if (data?.latitude && data?.longitude) {
                setUserLocation({lat: Number(data.latitude), lon: Number(data.longitude)});
            }
        };
        fetchLocation();
    }, [profile.id]);

    const loadPosts = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();

        // Build content type filter
        const contentTypes = [];
        if (contentFilters.image) {
            contentTypes.push("picture");
        }
        if (contentFilters.video) {
            contentTypes.push("video");
        }
        if (contentFilters.audio) {
            contentTypes.push("audio");
        }
        if (contentFilters.writing || contentFilters.text) {
            contentTypes.push("status");
        }

        const ratingFilter = feedMode === "sfw" ? ["sfw"] : ["sfw", "nsfw"];

        try {
            // 1. Load curated posts based on user's liked tags
            let curatedQuery = supabase
                .from("posts")
                .select(
                    `
                    id, content, created_at, media_type, media_url, images, audio_url, content_rating, is_promotional,
                    profiles!inner (id, username, display_name, avatar_url, latitude, longitude),
                    post_tags!inner (tag_id)
                    `
                )
                .in("media_type", contentTypes)
                .in("content_rating", ratingFilter)
                .eq("is_promotional", false);

            if (_likedTags.length > 0) {
                curatedQuery = curatedQuery.in("post_tags.tag_id", _likedTags.map(t => t.tag_id));
            }

            if (localOnly && userLocation && isLocalizedEnabled) {
                curatedQuery = curatedQuery
                    .gte("profiles.latitude", userLocation.lat - 1)
                    .lte("profiles.latitude", userLocation.lat + 1)
                    .gte("profiles.longitude", userLocation.lon - 1)
                    .lte("profiles.longitude", userLocation.lon + 1);
            }

            // 2. Load popular posts (most liked in the last 7 days)
            let popularQuery = supabase
                .from("posts")
                .select(
                    `
                    id, content, created_at, media_type, media_url, images, audio_url, content_rating, is_promotional,
                    profiles!inner (id, username, display_name, avatar_url, latitude, longitude)
                    `
                )
                .in("media_type", contentTypes)
                .in("content_rating", ratingFilter)
                .gt("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                .order("like_count", {ascending: false});

            if (localOnly && userLocation && isLocalizedEnabled) {
                popularQuery = popularQuery
                    .gte("profiles.latitude", userLocation.lat - 1)
                    .lte("profiles.latitude", userLocation.lat + 1)
                    .gte("profiles.longitude", userLocation.lon - 1)
                    .lte("profiles.longitude", userLocation.lon + 1);
            }

            const [curatedResult, popularResult] = await Promise.all([
                curatedQuery.order("created_at", {ascending: false}).limit(20),
                popularQuery.limit(20),
            ]);

            if (curatedResult.data) {
                setCuratedPosts(curatedResult.data.map((p: any) => ({
                    ...p,
                    profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
                })));
            }
            if (popularResult.data) {
                setPopularPosts(popularResult.data.map((p: any) => ({
                    ...p,
                    profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
                })));
            }
        } catch (error) {
            console.error("Error loading posts:", error);
        } finally {
            setLoading(false);
        }
    }, [feedMode, localOnly, userLocation, contentFilters, _likedTags]);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    // Load liked posts separately since it's not filtered by content type
    const loadInitialData = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();

        try {
            // Build content type filter
            const contentTypes = [];
            if (contentFilters.image) {
                contentTypes.push("image");
            }
            if (contentFilters.video) {
                contentTypes.push("video");
            }
            if (contentFilters.audio) {
                contentTypes.push("audio");
            }
            if (contentFilters.writing) {
                contentTypes.push("writing");
            }
            if (contentFilters.text) {
                contentTypes.push("text");
            }

            const ratingFilter = feedMode === "sfw" ? ["sfw"] : ["sfw", "nsfw"];

            // Load curated posts based on user's location and liked tags
            const curatedQuery = supabase
                .from("posts")
                .select(
                    `
                    id,
                    content,
                    created_at,
                    content_rating,
                    media_type,
                    media_url,
                    images,
                    audio_url,
                    content_type,
                    is_promotional,
                    profiles!inner (
                        id,
                        username,
                        display_name,
                        avatar_url,
                        location
                    )
                    `
                )
                .in("content_rating", ratingFilter)
                .order("created_at", {ascending: false})
                .limit(50);

            if (profile.location) {
                curatedQuery.eq("profiles.location", profile.location);
            }

            // Load popular posts
            const popularQuery = supabase
                .from("posts")
                .select(
                    `
                    id,
                    content,
                    created_at,
                    content_rating,
                    media_type,
                    media_url,
                    images,
                    audio_url,
                    content_type,
                    is_promotional,
                    profiles!inner (
                        id,
                        username,
                        display_name,
                        avatar_url
                    )
                    `
                )
                .in("content_rating", ratingFilter)
                .order("created_at", {ascending: false})
                .limit(50);

            // Load user's liked posts
            const likedQuery = supabase
                .from("post_likes")
                .select(
                    `
                    post_id,
                    posts!inner (
                        id,
                        content,
                        created_at,
                        content_rating,
                        media_type,
                        media_url,
                        images,
                        audio_url,
                        content_type,
                        is_promotional,
                        profiles!inner (
                            id,
                            username,
                            display_name,
                            avatar_url
                        )
                    )
                    `
                )
                .eq("user_id", profile.id)
                .order("created_at", {ascending: false})
                .limit(50);

            // Execute all queries in parallel
            const [
                {data: curated},
                {data: popular},
                {data: liked}
            ] = await Promise.all([
                curatedQuery,
                popularQuery,
                likedQuery
            ]);

            const filterPromotional = (posts: any[]) => {
                if (!contentFilters.promotional) {
                    return posts.filter((post: any) => !post.is_promotional);
                }
                return posts;
            };

            setCuratedPosts(filterPromotional(curated || []));
            setPopularPosts(filterPromotional(popular || []));
            setLikedPosts(filterPromotional(liked?.map((like: any) => like.posts).filter(Boolean) || []));
        } catch (error) {
            console.error("Error loading initial data:", error);
        } finally {
            setLoading(false);
        }
    }, [feedMode, profile.id, profile.location, contentFilters.image, contentFilters.video, contentFilters.audio, contentFilters.writing, contentFilters.text, contentFilters.promotional]);

    // Initial data loading
    useEffect(() => {
        loadPosts();
        loadInitialData();
    }, [loadPosts, loadInitialData]);

    const toggleFilter = (filter: keyof typeof contentFilters) => {
        setContentFilters((prev) => ({...prev, [filter]: !prev[filter]}));
    };

    return (
        <div className="space-y-6">
            <div
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-royal-purple/20">
                <div>
                    <h1 className="text-4xl font-bold text-gradient mb-2 flex items-center gap-3">
                        <Sparkles className="h-8 w-8 text-royal-purple"/>
                        Discover
                    </h1>
                    <p className="text-muted-foreground">Explore content from the community</p>
                </div>

                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFeedMode(feedMode === "sfw" ? "all" : "sfw")}
                        className="gap-2 border-royal-purple/20 bg-card/50 hover:bg-card"
                    >
                        {feedMode === "sfw" ? (
                            <>
                                <Eye className="h-4 w-4"/>
                                SFW Mode
                            </>
                        ) : (
                            <>
                                <EyeOff className="h-4 w-4"/>
                                All Content
                            </>
                        )}
                    </Button>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm"
                                    className="gap-2 bg-card/50 hover:bg-card border-royal-purple/20">
                                <Filter className="h-4 w-4"/>
                                Filters
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 bg-card border-royal-purple/20" align="end">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm">Content Types</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="filter-image"
                                            checked={contentFilters.image}
                                            onCheckedChange={() => toggleFilter("image")}
                                        />
                                        <Label htmlFor="filter-image"
                                               className="flex items-center gap-2 cursor-pointer">
                                            <ImageIcon className="h-4 w-4 text-royal-purple"/>
                                            Images
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="filter-video"
                                            checked={contentFilters.video}
                                            onCheckedChange={() => toggleFilter("video")}
                                        />
                                        <Label htmlFor="filter-video"
                                               className="flex items-center gap-2 cursor-pointer">
                                            <Video className="h-4 w-4 text-royal-blue"/>
                                            Videos
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="filter-audio"
                                            checked={contentFilters.audio}
                                            onCheckedChange={() => toggleFilter("audio")}
                                        />
                                        <Label htmlFor="filter-audio"
                                               className="flex items-center gap-2 cursor-pointer">
                                            <Music className="h-4 w-4 text-royal-green"/>
                                            Audio
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="filter-writing"
                                            checked={contentFilters.writing}
                                            onCheckedChange={() => toggleFilter("writing")}
                                        />
                                        <Label htmlFor="filter-writing"
                                               className="flex items-center gap-2 cursor-pointer">
                                            <FileText className="h-4 w-4 text-royal-orange"/>
                                            Writings
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="filter-text"
                                            checked={contentFilters.text}
                                            onCheckedChange={() => toggleFilter("text")}
                                        />
                                        <Label htmlFor="filter-text" className="flex items-center gap-2 cursor-pointer">
                                            <FileText className="h-4 w-4 text-muted-foreground"/>
                                            Text Posts
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2 border-t border-royal-purple/20">
                                        <Checkbox
                                            id="filter-promotional"
                                            checked={contentFilters.promotional}
                                            onCheckedChange={() => toggleFilter("promotional")}
                                        />
                                        <Label htmlFor="filter-promotional"
                                               className="flex items-center gap-2 cursor-pointer">
                                            <Megaphone className="h-4 w-4 text-amber-500"/>
                                            Promotional
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <TabsList
                        className={cn(
                            "grid bg-card/50 border border-royal-purple/20 h-12 w-full md:w-[400px]",
                            isRecommendationsEnabled ? "grid-cols-3" : "grid-cols-2"
                        )}>
                        {isRecommendationsEnabled && (
                            <TabsTrigger value="curated" className="text-base">
                                <Compass className="h-4 w-4 mr-2"/>
                                For You
                            </TabsTrigger>
                        )}
                    <TabsTrigger value="popular" className="text-base">
                        <TrendingUp className="h-4 w-4 mr-2"/>
                        Popular
                    </TabsTrigger>
                    <TabsTrigger value="liked" className="text-base">
                        <Heart className="h-4 w-4 mr-2"/>
                        Liked
                    </TabsTrigger>
                </TabsList>

                    <div className="flex gap-2">
                        {isLocalizedEnabled && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setLocalOnly(!localOnly)}
                                className={cn(
                                    "gap-2 border-royal-purple/20 bg-transparent h-12 px-6",
                                    localOnly && "bg-royal-purple text-white hover:bg-royal-purple/90"
                                )}
                            >
                                <MapPin className="h-4 w-4"/>
                                {localOnly ? "Local" : "Global"}
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFeedMode(feedMode === "sfw" ? "all" : "sfw")}
                            className={cn(
                                "gap-2 border-royal-purple/20 bg-transparent h-12 px-6",
                                feedMode === "all" && "bg-royal-auburn text-white hover:bg-royal-auburn/90"
                            )}
                        >
                            {feedMode === "sfw" ? (
                                <>
                                    <Eye className="h-4 w-4"/>
                                    SFW
                                </>
                            ) : (
                                <>
                                    <EyeOff className="h-4 w-4"/>
                                    All
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <TabsContent value="curated" className="mt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-royal-purple"/>
                        </div>
                    ) : curatedPosts.length === 0 ? (
                        <Card className="border-royal-purple/20">
                            <CardContent className="text-center py-16">
                                <Compass className="h-16 w-16 mx-auto mb-4 text-muted-foreground"/>
                                <h3 className="text-xl font-semibold mb-2">No posts found</h3>
                                <p className="text-muted-foreground">Try adjusting your filters to see more content!</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <MasonryGrid posts={curatedPosts}/>
                    )}
                </TabsContent>

                <TabsContent value="popular" className="mt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-royal-purple"/>
                        </div>
                    ) : popularPosts.length === 0 ? (
                        <Card className="border-royal-purple/20">
                            <CardContent className="text-center py-16">
                                <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground"/>
                                <h3 className="text-xl font-semibold mb-2">No posts found</h3>
                                <p className="text-muted-foreground">Try adjusting your filters to see more content!</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <MasonryGrid posts={popularPosts}/>
                    )}
                </TabsContent>

                <TabsContent value="liked" className="mt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-royal-purple"/>
                        </div>
                    ) : likedPosts.length === 0 ? (
                        <Card className="border-royal-purple/20">
                            <CardContent className="text-center py-16">
                                <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground"/>
                                <h3 className="text-xl font-semibold mb-2">No liked posts yet</h3>
                                <p className="text-muted-foreground">Start exploring and like posts to see them
                                    here!</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <MasonryGrid posts={likedPosts}/>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
