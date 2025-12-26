"use client";

import {Eye, EyeOff, Filter, Loader2, MapPin} from "lucide-react";
import {useEffect, useState} from "react";

import {EnhancedCreatePost} from "@/components/enhanced-create-post";
import {FeedAdSidebar} from "@/components/feed-ad-sidebar";
import {FeedSidebar} from "@/components/feed-sidebar";
import {FeedViewSettings, type PostDisplaySize} from "@/components/feed-view-settings";
import {PostCard} from "@/components/post-card";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {useInfiniteScroll} from "@/hooks/use-infinite-scroll";
import {cacheUtils, usePosts} from "@/lib/cache/hooks";
import {createClient} from "@/lib/supabase/client";
import {cn} from "@/lib/utils";

interface FeedClientProps {
    profile: {
        id: string
        username: string
        display_name: string | null
        avatar_url: string | null
    }
    initialPosts: Array<{
        id: string
        content: string
        created_at: string
        content_rating: string
        media_type: string | null
        media_url: string | null
        images?: string[] | null
        audio_url?: string | null
        visibility?: string
        author_profile: {
            id: string
            username: string
            display_name: string | null
            avatar_url: string | null
        }
        is_promotional: boolean
    }>
    isPremium?: boolean
}

const POSTS_PER_PAGE = 20;
const MAX_POSTS = 200;

export function FeedClient({profile, initialPosts, isPremium = false}: FeedClientProps) {
    const [mounted, setMounted] = useState(false);
    const {data: cachedPosts, mutate: mutatePosts} = usePosts();
    const [posts, setPosts] = useState(initialPosts);
    const [feedMode, setFeedMode] = useState<"sfw" | "all">("sfw");
    const [localOnly, setLocalOnly] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lon: number } | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(initialPosts.length === POSTS_PER_PAGE);
    const [offset, setOffset] = useState(POSTS_PER_PAGE);
    const [activeFilter, setActiveFilter] = useState("all");
    const [contentFilters, setContentFilters] = useState({
        hidePromotional: true,
        showPictures: true,
        showVideos: true,
        showWritings: true,
        showAudio: true,
    });
    const [displaySize, setDisplaySize] = useState<PostDisplaySize>("normal");

    useEffect(() => {
        if (cachedPosts && cachedPosts.length > 0) {
            console.log("[v0] Using cached posts:", cachedPosts.length);
            setPosts(cachedPosts);
        }
    }, [cachedPosts]);

    useEffect(() => {
        setMounted(true);
        // Load saved display size from localStorage
        const savedSize = localStorage.getItem("feedDisplaySize") as PostDisplaySize;
        if (savedSize) {
            setDisplaySize(savedSize);
        }

        // Fetch user location for localized filtering
        const fetchLocation = async () => {
            const supabase = createClient();
            const {data} = await supabase.from("profiles").select("latitude, longitude").eq("id", profile.id).single();
            if (data?.latitude && data?.longitude) {
                setUserLocation({lat: Number(data.latitude), lon: Number(data.longitude)});
            }
        };
        fetchLocation();
    }, [profile.id]);

    useEffect(() => {
        // Reset posts and reload when toggles change
        const reloadPosts = async () => {
            if (!mounted) return;
            setIsLoadingMore(true);
            const supabase = createClient();

            let query = supabase
                .from("posts")
                .select(`
                    id, content, created_at, content_rating, media_type, media_url, images, audio_url, visibility, is_promotional,
                    author_profile:profiles!inner (id, username, display_name, avatar_url, latitude, longitude)
                `);

            if (feedMode === "sfw") {
                query = query.eq("content_rating", "sfw");
            }

            if (localOnly && userLocation) {
                // Simplified localized filter: within approx 1 degree (~111km)
                query = query
                    .gte("author_profile.latitude", userLocation.lat - 1)
                    .lte("author_profile.latitude", userLocation.lat + 1)
                    .gte("author_profile.longitude", userLocation.lon - 1)
                    .lte("author_profile.longitude", userLocation.lon + 1);
            }

            const {data} = await query.order("created_at", {ascending: false}).limit(POSTS_PER_PAGE);

            if (data) {
                const mapped = (data as any[]).map(p => ({
                    ...p,
                    author_profile: Array.isArray(p.author_profile) ? p.author_profile[0] : p.author_profile
                }));
                setPosts(mapped);
                setOffset(POSTS_PER_PAGE);
                setHasMore(data.length === POSTS_PER_PAGE);
            }
            setIsLoadingMore(false);
        };

        reloadPosts();
    }, [feedMode, localOnly, userLocation, mounted]);

    const handleDisplaySizeChange = (size: PostDisplaySize) => {
        setDisplaySize(size);
        localStorage.setItem("feedDisplaySize", size);
    };

    const loadMorePosts = async () => {
        if (isLoadingMore || !hasMore || posts.length >= MAX_POSTS) {
            if (posts.length >= MAX_POSTS) setHasMore(false);
            return;
        }

        setIsLoadingMore(true);
        const supabase = createClient();

        let query = supabase
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
        visibility,
        author_profile:profiles!inner (
          id,
          username,
          display_name,
          avatar_url,
          latitude,
          longitude
        ),
        is_promotional
      `,
            );

        if (feedMode === "sfw") {
            query = query.eq("content_rating", "sfw");
        }

        if (localOnly && userLocation) {
            query = query
                .gte("author_profile.latitude", userLocation.lat - 1)
                .lte("author_profile.latitude", userLocation.lat + 1)
                .gte("author_profile.longitude", userLocation.lon - 1)
                .lte("author_profile.longitude", userLocation.lon + 1);
        }

        const {data} = await query
            .order("created_at", {ascending: false})
            .range(offset, offset + POSTS_PER_PAGE - 1);

        if (data) {
            const mapped = (data as any[]).map(p => ({
                ...p,
                author_profile: Array.isArray(p.author_profile) ? p.author_profile[0] : p.author_profile
            }));
            const newPosts = [...posts, ...mapped];
            setPosts(newPosts);
            mutatePosts(newPosts, false);
            setOffset((prev) => prev + POSTS_PER_PAGE);
            setHasMore(data.length === POSTS_PER_PAGE && newPosts.length < MAX_POSTS);
        }
        setIsLoadingMore(false);
    };

    const loadMoreRef = useInfiniteScroll({
        onLoadMore: loadMorePosts,
        hasMore,
        isLoading: isLoadingMore,
    });

    const refreshPosts = async () => {
        const supabase = createClient();
        let query = supabase
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
        visibility,
        author_profile:profiles!inner (
          id,
          username,
          display_name,
          avatar_url,
          latitude,
          longitude
        ),
        is_promotional
      `,
            );

        if (feedMode === "sfw") {
            query = query.eq("content_rating", "sfw");
        }

        if (localOnly && userLocation) {
            query = query
                .gte("author_profile.latitude", userLocation.lat - 1)
                .lte("author_profile.latitude", userLocation.lat + 1)
                .gte("author_profile.longitude", userLocation.lon - 1)
                .lte("author_profile.longitude", userLocation.lon + 1);
        }

        const {data} = await query
            .order("created_at", {ascending: false})
            .limit(POSTS_PER_PAGE);

        if (data) {
            const mapped = (data as any[]).map(p => ({
                ...p,
                author_profile: Array.isArray(p.author_profile) ? p.author_profile[0] : p.author_profile
            }));
            setPosts(mapped);
            mutatePosts(mapped, false);
            cacheUtils.invalidatePosts();
            setOffset(POSTS_PER_PAGE);
            setHasMore(data.length === POSTS_PER_PAGE);
        }
    };

    const filteredPosts = posts
        .filter((post) => (feedMode === "sfw" ? post.content_rating === "sfw" : true))
        .filter((post) => {
            // Hide promotional posts if filter is enabled
            if (contentFilters.hidePromotional && post.is_promotional) {
                return false;
            }

            // Apply sidebar filter (all, pictures, videos, audio, status)
            if (activeFilter === "pictures" && post.media_type !== "picture") {
                return false;
            }
            if (activeFilter === "videos" && post.media_type !== "video") {
                return false;
            }
            if (activeFilter === "audio" && post.media_type !== "audio") {
                return false;
            }
            if (activeFilter === "status" && post.media_type !== "status" && post.media_type !== null) {
                return false;
            }

            // Apply content type filters from the Filter popover
            if (post.media_type === "picture" && !contentFilters.showPictures) {
                return false;
            }
            if (post.media_type === "video" && !contentFilters.showVideos) {
                return false;
            }
            if (post.media_type === "audio" && !contentFilters.showAudio) {
                return false;
            }
            if ((post.media_type === "status" || post.media_type === null) && !contentFilters.showWritings) {
                return false;
            }

            return true;
        });

    if (!mounted) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-royal-purple"/>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
            {/* Left Sidebar - Filters */}
            <aside className="hidden lg:block">
                <FeedSidebar activeFilter={activeFilter} onFilterChange={setActiveFilter}/>
            </aside>

            {/* Main Feed */}
            <div className="space-y-6">
                <div className="flex justify-end gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm"
                                    className="gap-2 border-royal-purple/20 lg:hidden bg-transparent">
                                <Filter className="h-4 w-4"/>
                                Filter
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 bg-card border-royal-purple/20">
                            <div className="space-y-3">
                                <h4 className="font-semibold text-sm">Content Filters</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="pictures"
                                            checked={contentFilters.showPictures}
                                            onCheckedChange={(checked) => setContentFilters({
                                                ...contentFilters,
                                                showPictures: !!checked
                                            })}
                                        />
                                        <label htmlFor="pictures" className="text-sm cursor-pointer">
                                            Show Pictures
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="videos"
                                            checked={contentFilters.showVideos}
                                            onCheckedChange={(checked) => setContentFilters({
                                                ...contentFilters,
                                                showVideos: !!checked
                                            })}
                                        />
                                        <label htmlFor="videos" className="text-sm cursor-pointer">
                                            Show Videos
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="audio"
                                            checked={contentFilters.showAudio}
                                            onCheckedChange={(checked) => setContentFilters({
                                                ...contentFilters,
                                                showAudio: !!checked
                                            })}
                                        />
                                        <label htmlFor="audio" className="text-sm cursor-pointer">
                                            Show Audio
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="writings"
                                            checked={contentFilters.showWritings}
                                            onCheckedChange={(checked) => setContentFilters({
                                                ...contentFilters,
                                                showWritings: !!checked
                                            })}
                                        />
                                        <label htmlFor="writings" className="text-sm cursor-pointer">
                                            Show Writings
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="promotional"
                                            checked={!contentFilters.hidePromotional}
                                            onCheckedChange={(checked) => setContentFilters({
                                                ...contentFilters,
                                                hidePromotional: !checked
                                            })}
                                        />
                                        <label htmlFor="promotional" className="text-sm cursor-pointer">
                                            Show Promotional
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <FeedViewSettings currentSize={displaySize} onSizeChange={handleDisplaySizeChange}/>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocalOnly(!localOnly)}
                        className={cn(
                            "gap-2 border-royal-purple/20 bg-transparent",
                            localOnly && "bg-royal-purple text-white hover:bg-royal-purple/90"
                        )}
                    >
                        <MapPin className="h-4 w-4"/>
                        {localOnly ? "Local" : "Global"}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFeedMode(feedMode === "sfw" ? "all" : "sfw")}
                        className={cn(
                            "gap-2 border-royal-purple/20 bg-transparent",
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

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshPosts}
                        className="gap-2 border-royal-purple/20 bg-transparent"
                    >
                        Refresh
                    </Button>
                </div>

                <EnhancedCreatePost userProfile={profile} onPostCreated={refreshPosts} isPremium={isPremium}/>

                <div className="space-y-4">
                    {filteredPosts.map((post) => (
                        <PostCard key={post.id} post={post} displaySize={displaySize}/>
                    ))}

                    {filteredPosts.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No posts match your filters. Try adjusting your settings!</p>
                        </div>
                    )}

                    {hasMore && posts.length < MAX_POSTS && (
                        <div ref={loadMoreRef} className="py-8 text-center">
                            {isLoadingMore && (
                                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin"/>
                                    <span>Loading more posts...</span>
                                </div>
                            )}
                        </div>
                    )}

                    {posts.length >= MAX_POSTS && (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>You've reached the end of the feed. Refresh to see new posts!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Sidebar - Ads & Suggestions */}
            <aside className="hidden xl:block">
                <FeedAdSidebar/>
            </aside>
        </div>
    );
}
