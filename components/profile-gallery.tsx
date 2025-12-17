"use client";

import {Eye, FileText, ImageIcon, Music, Video} from "lucide-react";
import Link from "next/link";
import {useEffect, useState} from "react";

import {MediaViewer} from "@/components/media-viewer";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {createClient} from "@/lib/supabase/client";

interface ProfileGalleryProps {
    userId: string
    mediaType: "picture" | "video" | "audio" | "writing"
}

export function ProfileGallery({userId, mediaType}: ProfileGalleryProps) {
    const [mediaItems, setMediaItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMedia, setSelectedMedia] = useState<any>(null);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [contentFilter, setContentFilter] = useState<"all" | "sfw" | "nsfw">("all");

    useEffect(() => {
        loadMediaItems();
    }, [userId, mediaType, contentFilter]);

    const loadMediaItems = async () => {
        setIsLoading(true);
        const supabase = createClient();

        let query = supabase
            .from("media_items")
            .select("*")
            .eq("user_id", userId)
            .eq("media_type", mediaType)
            .order("created_at", {ascending: false})
            .limit(50);

        if (contentFilter === "sfw") {
            query = query.or("content_rating.is.null,content_rating.neq.nsfw");
        } else if (contentFilter === "nsfw") {
            query = query.eq("content_rating", "nsfw");
        }

        const {data, error} = await query;

        if (error) {
            console.error("[v0] Error loading media:", error);
        } else {
            setMediaItems(data || []);
        }

        setIsLoading(false);
    };

    const handleMediaClick = (media: any) => {
        setSelectedMedia(media);
        setViewerOpen(true);
    };

    const getMediaIcon = () => {
        switch (mediaType) {
            case "picture":
                return <ImageIcon className="h-6 w-6"/>;
            case "video":
                return <Video className="h-6 w-6"/>;
            case "audio":
                return <Music className="h-6 w-6"/>;
            case "writing":
                return <FileText className="h-6 w-6"/>;
        }
    };

    if (isLoading) {
        return (
            <Card className="border-royal-purple/20 bg-card/50">
                <CardContent className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-purple mx-auto"/>
                    <p className="text-muted-foreground mt-4">Loading {mediaType}s...</p>
                </CardContent>
            </Card>
        );
    }

    if (mediaItems.length === 0) {
        return (
            <Card className="border-royal-purple/20 bg-card/50">
                <CardContent className="p-12 text-center">
                    <div className="flex justify-center mb-4 text-muted-foreground">{getMediaIcon()}</div>
                    <h3 className="text-lg font-semibold mb-2">No {mediaType}s yet</h3>
                    <p className="text-muted-foreground">Upload your first {mediaType} to get started!</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="border-royal-purple/20 bg-card/50">
                <CardHeader>
                    <Tabs value={contentFilter} onValueChange={(v) => setContentFilter(v as any)} className="w-full">
                        <TabsList className="grid grid-cols-3 w-full max-w-md">
                            <TabsTrigger value="all">All Content</TabsTrigger>
                            <TabsTrigger value="sfw">SFW Only</TabsTrigger>
                            <TabsTrigger value="nsfw">NSFW Only</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent className="p-6">
                    {mediaType === "picture" || mediaType === "video" ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {mediaItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="relative aspect-square rounded-lg overflow-hidden border border-royal-purple/20 hover:border-royal-purple/40 transition-all cursor-pointer group"
                                    onClick={() => handleMediaClick(item)}
                                >
                                    {mediaType === "picture" ? (
                                        <img
                                            src={item.media_url || "/placeholder.svg"}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                            onContextMenu={(e) => e.preventDefault()}
                                            draggable={false}
                                            style={{userSelect: "none"}}
                                        />
                                    ) : (
                                        <video
                                            src={item.media_url}
                                            className="w-full h-full object-cover"
                                            controlsList="nodownload"
                                            onContextMenu={(e) => e.preventDefault()}
                                            style={{userSelect: "none"}}
                                        />
                                    )}
                                    <div
                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Eye className="h-8 w-8 text-white"/>
                                    </div>
                                    {item.content_rating === "nsfw" &&
                                        <Badge className="absolute top-2 right-2 bg-red-500">NSFW</Badge>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {mediaItems.map((item) => (
                                <Link key={item.id} href={`/media/${item.id}`}>
                                    <Card
                                        className="border-royal-purple/20 hover:border-royal-purple/40 transition-all cursor-pointer">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-royal-purple to-royal-blue flex-shrink-0">
                                                    {getMediaIcon()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold truncate">{item.title}</h3>
                                                    {item.description && (
                                                        <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {new Date(item.created_at).toLocaleDateString()}
                                                        </Badge>
                                                        {item.content_rating === "nsfw" &&
                                                            <Badge className="text-xs bg-red-500">NSFW</Badge>}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedMedia && (
                <MediaViewer
                    open={viewerOpen}
                    onOpenChange={setViewerOpen}
                    mediaUrl={selectedMedia.media_url}
                    mediaType={mediaType === "video" ? "video" : "image"}
                    title={selectedMedia.title}
                    description={selectedMedia.description}
                    allMedia={mediaItems
                        .filter((m) => m.media_type === mediaType)
                        .map((m) => ({
                            url: m.media_url,
                            type: m.media_type === "video" ? "video" : "image",
                            title: m.title,
                        }))}
                    currentIndex={mediaItems.findIndex((m) => m.id === selectedMedia.id)}
                    onNavigate={(index) => {
                        setSelectedMedia(mediaItems[index]);
                    }}
                />
            )}
        </>
    );
}
