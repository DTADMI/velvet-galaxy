"use client";

import {formatDistanceToNow} from "date-fns";
import {
    Bookmark,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Heart,
    MessageCircle,
    MoreHorizontal,
    Send,
    Share2,
} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import type React from "react";
import {useEffect, useState} from "react";
import {toast} from "sonner";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {createBrowserClient} from "@/lib/supabase/client";
import {cn} from "@/lib/utils";

interface MediaViewerPageProps {
    mediaItem: any
    userMedia: any[]
    currentMediaId: string
    currentUserId: string
    previousMedia?: { id: string } | null
    nextMedia?: { id: string } | null
    currentIndex: number
    totalMediaCount: number
}

const MediaViewerPage = ({
                             mediaItem,
                             userMedia,
                             currentMediaId,
                             currentUserId,
                             previousMedia,
                             nextMedia,
                             currentIndex,
                             totalMediaCount,
                         }: MediaViewerPageProps) => {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [likesWithProfiles, setLikesWithProfiles] = useState<any[]>([]);
    const [showAllLikes, setShowAllLikes] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                if (previousMedia) {
                    router.push(`/media/${previousMedia.id}`);
                } else {
                    const userId = mediaItem.profiles.id;
                    router.push(`/profile/${userId}?tab=content`);
                }
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                if (nextMedia) {
                    router.push(`/media/${nextMedia.id}`);
                } else {
                    const userId = mediaItem.profiles.id;
                    router.push(`/profile/${userId}?tab=content`);
                }
            } else if (e.key === "Escape") {
                const userId = mediaItem.profiles.id;
                router.push(`/profile/${userId}?tab=content`);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [previousMedia, nextMedia, router, mediaItem]);

    useEffect(() => {
        const handlePopState = () => {
            // Browser back/forward buttons will naturally work with router.push
            // This ensures the page updates correctly
            loadMediaStats();
            loadComments();
            loadLikesWithProfiles();
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [currentMediaId]);

    useEffect(() => {
        loadMediaStats();
        loadComments();
        loadLikesWithProfiles();
    }, [currentMediaId]);

    const loadMediaStats = async () => {
        const {count: likes} = await supabase
            .from("media_likes")
            .select("id", {count: "exact"})
            .eq("media_item_id", currentMediaId);

        const {data: userLike} = await supabase
            .from("media_likes")
            .select("id")
            .eq("media_item_id", currentMediaId)
            .eq("user_id", currentUserId)
            .single();

        setLiked(!!userLike);
        setLikeCount(likes || 0);
    };

    const loadLikesWithProfiles = async () => {
        const {data: likes} = await supabase
            .from("media_likes")
            .select(
                `
        id,
        user_id,
        created_at,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `,
            )
            .eq("media_item_id", currentMediaId)
            .order("created_at", {ascending: false})
            .limit(100);

        setLikesWithProfiles(likes || []);
    };

    const loadComments = async () => {
        setComments([]);
    };

    const toggleLike = async () => {
        if (liked) {
            await supabase.from("media_likes").delete().eq("media_item_id", currentMediaId).eq("user_id", currentUserId);
            setLiked(false);
            setLikeCount((prev) => prev - 1);
            loadLikesWithProfiles();
        } else {
            await supabase.from("media_likes").insert({media_item_id: currentMediaId, user_id: currentUserId});
            setLiked(true);
            setLikeCount((prev) => prev + 1);
            loadLikesWithProfiles();
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: mediaItem.title || "Shared media",
                    text: mediaItem.description || "",
                    url: window.location.href,
                });
                toast.success("Shared successfully");
            } catch (error) {
                console.error("Share error:", error);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied to clipboard");
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        return false;
    };

    const handleMediaClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (totalMediaCount <= 1) {
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;

        // Left third - go to previous
        if (clickX < width / 3) {
            if (previousMedia) {
                router.push(`/media/${previousMedia.id}`);
            } else {
                router.push(`/profile/${mediaItem.profiles.id}?tab=content`);
            }
        }
        // Right third - go to next
        else if (clickX > (width * 2) / 3) {
            if (nextMedia) {
                router.push(`/media/${nextMedia.id}`);
            } else {
                router.push(`/profile/${mediaItem.profiles.id}?tab=content`);
            }
        }
    };

    const topLikes = likesWithProfiles.slice(0, 7);
    const displayedLikes = showAllLikes ? likesWithProfiles : likesWithProfiles.slice(0, 50);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-royal-purple/5">
            <div className="container mx-auto max-w-7xl p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* User Header Card */}
                        <Card className="border-royal-purple/30 bg-card/80 backdrop-blur-sm shadow-lg">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <Link
                                        href={`/profile/${mediaItem.profiles.id}`}
                                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                                    >
                                        <Avatar
                                            className="h-12 w-12 border-2 border-royal-purple ring-2 ring-royal-purple/20">
                                            <AvatarImage
                                                src={mediaItem.profiles.avatar_url || undefined}
                                                alt={mediaItem.profiles.display_name || mediaItem.profiles.username}
                                            />
                                            <AvatarFallback
                                                className="bg-gradient-to-br from-royal-purple to-royal-blue text-white font-semibold">
                                                {(mediaItem.profiles.display_name || mediaItem.profiles.username)[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-lg">
                                                    {mediaItem.profiles.display_name || mediaItem.profiles.username}
                                                </p>
                                                {mediaItem.profiles.is_verified && (
                                                    <CheckCircle
                                                        className="h-4 w-4 text-royal-purple fill-royal-purple"/>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {formatDistanceToNow(new Date(mediaItem.created_at), {addSuffix: true})}
                                            </p>
                                        </div>
                                    </Link>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="secondary"
                                            className="capitalize bg-royal-purple/20 text-royal-purple border-royal-purple/30"
                                        >
                                            {mediaItem.media_type}
                                        </Badge>
                                        {mediaItem.content_rating === "nsfw" && (
                                            <Badge variant="secondary"
                                                   className="bg-destructive/20 text-destructive border-destructive/30">
                                                NSFW
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Media Display Card */}
                        <Card className="border-royal-purple/30 bg-card/80 backdrop-blur-sm shadow-lg overflow-hidden">
                            <div className="relative bg-black" onContextMenu={handleContextMenu}>
                                <div
                                    className="relative group"
                                    onClick={handleMediaClick}
                                    style={{cursor: totalMediaCount > 1 ? "pointer" : "default"}}
                                >
                                    {mediaItem.media_type === "video" ? (
                                        <video
                                            src={mediaItem.media_url}
                                            controls
                                            controlsList="nodownload"
                                            className="w-full max-h-[70vh] object-contain"
                                            style={{userSelect: "none"}}
                                            onContextMenu={handleContextMenu}
                                            onClick={(e) => e.stopPropagation()}
                                            aria-label={mediaItem.title || "Video content"}
                                        />
                                    ) : (
                                        <img
                                            src={mediaItem.media_url || "/placeholder.svg"}
                                            alt={mediaItem.title || "Media content"}
                                            className="w-full max-h-[70vh] object-contain select-none"
                                            draggable={false}
                                            onContextMenu={handleContextMenu}
                                            style={{userSelect: "none"}}
                                        />
                                    )}

                                    {totalMediaCount > 1 && (
                                        <>
                                            <Button
                                                size="lg"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (previousMedia) {
                                                        router.push(`/media/${previousMedia.id}`);
                                                    } else {
                                                        router.push(`/profile/${mediaItem.profiles.id}?tab=content`);
                                                    }
                                                }}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white h-14 w-14 rounded-full shadow-2xl border-2 border-white/20 opacity-70 group-hover:opacity-100 transition-all"
                                                aria-label="Previous media"
                                            >
                                                <ChevronLeft className="h-7 w-7"/>
                                            </Button>
                                            <Button
                                                size="lg"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (nextMedia) {
                                                        router.push(`/media/${nextMedia.id}`);
                                                    } else {
                                                        router.push(`/profile/${mediaItem.profiles.id}?tab=content`);
                                                    }
                                                }}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white h-14 w-14 rounded-full shadow-2xl border-2 border-white/20 opacity-70 group-hover:opacity-100 transition-all"
                                                aria-label="Next media"
                                            >
                                                <ChevronRight className="h-7 w-7"/>
                                            </Button>
                                            <div
                                                className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold border border-white/20 shadow-lg">
                                                {currentIndex + 1} / {totalMediaCount}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <CardContent className="p-6 space-y-4">
                                {/* Title and Description */}
                                {mediaItem.title &&
                                    <h1 className="text-2xl font-bold text-foreground">{mediaItem.title}</h1>}
                                {mediaItem.description && (
                                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{mediaItem.description}</p>
                                )}

                                {/* Engagement Bar */}
                                <div className="flex items-center justify-between pt-4 border-t border-royal-purple/20">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="lg"
                                            onClick={toggleLike}
                                            className={cn(
                                                "gap-2 transition-all",
                                                liked
                                                    ? "text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                                            )}
                                            aria-label={liked ? "Unlike" : "Like"}
                                        >
                                            <Heart className={`h-6 w-6 ${liked ? "fill-current" : ""}`}/>
                                            <span className="font-semibold">{likeCount}</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="lg"
                                            className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                            aria-label="Comments"
                                        >
                                            <MessageCircle className="h-6 w-6"/>
                                            <span className="font-semibold">{comments.length}</span>
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleShare}
                                            className="text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                            aria-label="Share"
                                        >
                                            <Share2 className="h-5 w-5"/>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                            aria-label="Bookmark"
                                        >
                                            <Bookmark className="h-5 w-5"/>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                            aria-label="More options"
                                        >
                                            <MoreHorizontal className="h-5 w-5"/>
                                        </Button>
                                    </div>
                                </div>

                                {/* Comments Section */}
                                <div className="space-y-4 pt-4 border-t border-royal-purple/20">
                                    <h3 className="font-semibold text-lg">Comments ({comments.length})</h3>

                                    {comments.length === 0 && (
                                        <p className="text-center text-muted-foreground py-8">No comments yet. Be the
                                            first to comment!</p>
                                    )}

                                    <div className="flex gap-3">
                                        <Avatar className="h-10 w-10 border-2 border-royal-purple">
                                            <AvatarFallback
                                                className="bg-gradient-to-br from-royal-purple to-royal-blue text-white">
                                                You
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 flex gap-2">
                                            <Input
                                                placeholder="Write a comment..."
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                className="border-royal-purple/30 focus-visible:ring-royal-purple"
                                                aria-label="Comment input"
                                            />
                                            <Button
                                                size="icon"
                                                disabled={!newComment.trim()}
                                                className="bg-royal-purple hover:bg-royal-purple/90"
                                                aria-label="Send comment"
                                            >
                                                <Send className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        {likesWithProfiles.length > 0 && (
                            <Card className="border-royal-purple/30 bg-card/80 backdrop-blur-sm shadow-lg">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                                            {likeCount} Likes This
                                        </h3>
                                        {likesWithProfiles.length > 50 && (
                                            <Button
                                                variant="link"
                                                size="sm"
                                                onClick={() => setShowAllLikes(!showAllLikes)}
                                                className="text-royal-purple hover:text-royal-purple/80 text-xs"
                                            >
                                                {showAllLikes ? "Show Less" : `View All ${likeCount}`}
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-6 gap-2 max-h-[400px] overflow-y-auto">
                                        {displayedLikes.map((like: any) => (
                                            <Link
                                                key={like.id}
                                                href={`/profile/${like.profiles.id}`}
                                                className="group relative aspect-square"
                                                title={like.profiles.display_name || like.profiles.username}
                                            >
                                                <Avatar
                                                    className="h-full w-full border border-royal-purple/30 group-hover:border-royal-purple transition-all">
                                                    <AvatarImage
                                                        src={like.profiles.avatar_url || undefined}
                                                        alt={like.profiles.display_name || like.profiles.username}
                                                    />
                                                    <AvatarFallback
                                                        className="bg-gradient-to-br from-royal-purple to-royal-blue text-white text-xs">
                                                        {(like.profiles.display_name || like.profiles.username)[0].toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {like.profiles.is_verified && (
                                                    <CheckCircle
                                                        className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-royal-purple fill-white rounded-full"/>
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card
                            className="border-royal-purple/30 bg-gradient-to-br from-royal-purple/10 to-royal-blue/10 backdrop-blur-sm shadow-lg">
                            <CardContent className="p-4 space-y-3">
                                <div
                                    className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Advertisement
                                </div>
                                <div
                                    className="aspect-square bg-gradient-to-br from-royal-purple/20 to-royal-blue/20 rounded-lg flex items-center justify-center">
                                    <p className="text-sm text-muted-foreground">Ad Space</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="font-semibold text-sm">Premium Content</p>
                                    <p className="text-xs text-muted-foreground">Discover exclusive features</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* More from User */}
                        <Card className="border-royal-purple/30 bg-card/80 backdrop-blur-sm shadow-lg">
                            <CardContent className="p-4 space-y-3">
                                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                                    More from this user
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {userMedia.slice(0, 9).map((media) => (
                                        <Link
                                            key={media.id}
                                            href={`/media/${media.id}`}
                                            className={cn(
                                                "aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 hover:shadow-lg",
                                                media.id === currentMediaId
                                                    ? "border-royal-purple ring-2 ring-royal-purple/30"
                                                    : "border-transparent hover:border-royal-purple/50",
                                            )}
                                        >
                                            {media.media_type === "video" ? (
                                                <video
                                                    src={media.media_url}
                                                    className="w-full h-full object-cover"
                                                    aria-label={media.title || "Video thumbnail"}
                                                />
                                            ) : (
                                                <img
                                                    src={media.media_url || "/placeholder.svg"}
                                                    alt={media.title || "Media thumbnail"}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export {MediaViewerPage};
export default MediaViewerPage;
