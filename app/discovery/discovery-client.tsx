"use client";

import {useEffect, useState} from "react";
import {Heart, Sparkles, TrendingUp} from "lucide-react";
import {Navigation} from "@/components/navigation";
import {PostCard} from "@/components/post-card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {getCuratedContent, getLikedContent, getPopularContent} from "@/app/actions/recommendations";
import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";

export default function DiscoveryPage({profile}: { profile: any }) {
    const [popular, setPopular] = useState<any[]>([]);
    const [curated, setCurated] = useState<any[]>([]);
    const [liked, setLiked] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [feedMode, setFeedMode] = useState<"sfw" | "all">("sfw");
    const [showPromotional, setShowPromotional] = useState(true);

    useEffect(() => {
        const loadDiscoveryData = async () => {
            setIsLoading(true);
            const [pop, cur, lik] = await Promise.all([
                getPopularContent(profile?.latitude, profile?.longitude),
                getCuratedContent(),
                getLikedContent()
            ]);
            setPopular(pop);
            setCurated(cur);
            setLiked(lik);
            setIsLoading(false);
        };
        loadDiscoveryData();
    }, [profile]);

    const filterContent = (posts: any[]) => {
        return posts
            .filter(p => (feedMode === "sfw" ? p.content_rating === "sfw" : true))
            .filter(p => (showPromotional ? true : !p.is_promotional));
    };

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto px-4 max-w-4xl">
                    <header
                        className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-gradient mb-2">Discovery Hub</h1>
                            <p className="text-muted-foreground">Explore what's happening in your local galaxy</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFeedMode(feedMode === "sfw" ? "all" : "sfw")}
                                className={cn(
                                    "gap-2 border-royal-purple/20 bg-transparent",
                                    feedMode === "all" && "bg-royal-auburn text-white"
                                )}
                            >
                                {feedMode === "sfw" ? "SFW" : "All Content"}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPromotional(!showPromotional)}
                                className={cn(
                                    "gap-2 border-royal-purple/20 bg-transparent",
                                    showPromotional && "bg-royal-blue text-white"
                                )}
                            >
                                {showPromotional ? "Promoted ON" : "No Ads"}
                            </Button>
                        </div>
                    </header>

                    <Tabs defaultValue="curated" className="w-full">
                        <TabsList className="grid grid-cols-3 bg-card/50 border border-royal-purple/20 mb-8">
                            <TabsTrigger value="curated" className="gap-2">
                                <Sparkles className="h-4 w-4"/>
                                Curated
                            </TabsTrigger>
                            <TabsTrigger value="popular" className="gap-2">
                                <TrendingUp className="h-4 w-4"/>
                                Popular Local
                            </TabsTrigger>
                            <TabsTrigger value="liked" className="gap-2">
                                <Heart className="h-4 w-4"/>
                                My Likes
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="curated" className="space-y-6">
                            {isLoading ? <DiscoverySkeleton/> : filterContent(curated).map(post => (
                                <PostCard key={post.id} post={post} currentUserId={profile.id}/>
                            ))}
                        </TabsContent>

                        <TabsContent value="popular" className="space-y-6">
                            {isLoading ? <DiscoverySkeleton/> : filterContent(popular).map(post => (
                                <PostCard key={post.id} post={post} currentUserId={profile.id}/>
                            ))}
                        </TabsContent>

                        <TabsContent value="liked" className="space-y-6">
                            {isLoading ? <DiscoverySkeleton/> : filterContent(liked).map(post => (
                                <PostCard key={post.id} post={post} currentUserId={profile.id}/>
                            ))}
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </>
    );
}

function DiscoverySkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-64 w-full bg-card/50 animate-pulse rounded-xl border border-royal-purple/10"/>
            ))}
        </div>
    );
}
