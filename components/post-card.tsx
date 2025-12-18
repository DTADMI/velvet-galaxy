"use client";

import {formatDistanceToNow} from "date-fns";
import {Eye, Heart, Lock, MessageCircle, MoreHorizontal, Play, Share2, Volume2} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";

import type {PostDisplaySize} from "@/components/feed-view-settings";
import {ImageCarousel} from "@/components/image-carousel";
import {PollDisplay} from "@/components/poll-display";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardFooter, CardHeader} from "@/components/ui/card";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {createClient} from "@/lib/supabase/client";

interface PostCardProps {
    post: {
        id: string
        content: string
        created_at: string
        content_rating?: string
        media_type?: string | null
        media_url?: string | null
        images?: string[] | null
        audio_url?: string | null
        is_promotional?: boolean
        visibility?: string
        poll_question?: string | null
        poll_options?: any[] | null
        poll_multiple_choice?: boolean | null
        poll_end_date?: string | null
        author_profile: {
            id: string
            username: string
            display_name: string | null
            avatar_url: string | null
        }
    }
    displaySize?: PostDisplaySize
}

export function PostCard({post, displaySize = "normal"}: PostCardProps) {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [commentCount, setCommentCount] = useState(0);
    const [showNSFW, setShowNSFW] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    const isPoll = post.media_type === "poll" && post.poll_question && post.poll_options;

    useEffect(() => {
        loadPostStats();
        getCurrentUser();
    }, []);

    const getCurrentUser = async () => {
        const {
            data: {user},
        } = await supabase.auth.getUser();
        if (user) {
            setCurrentUserId(user.id);
        }
    };

    const loadPostStats = async () => {
        const {count: likes} = await supabase.from("post_likes").select("id", {count: "exact"}).eq("post_id", post.id);

        const {count: comments} = await supabase.from("comments").select("id", {count: "exact"}).eq("post_id", post.id);

        const {
            data: {user},
        } = await supabase.auth.getUser();
        if (user) {
            const {data: userLike} = await supabase
                .from("post_likes")
                .select("id")
                .eq("post_id", post.id)
                .eq("user_id", user.id)
                .single();

            setLiked(!!userLike);
        }

        setLikeCount(likes || 0);
        setCommentCount(comments || 0);
    };

    const toggleLike = async () => {
        const {
            data: {user},
        } = await supabase.auth.getUser();
        if (!user) {
            return;
        }

        if (liked) {
            await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
            setLiked(false);
            setLikeCount((prev) => prev - 1);
        } else {
            await supabase.from("post_likes").insert({post_id: post.id, user_id: user.id});
            setLiked(true);
            setLikeCount((prev) => prev + 1);
        }
    };

    const deletePost = async () => {
        if (!confirm("Are you sure you want to delete this post?")) {
            return;
        }

        const {error} = await supabase.from("posts").delete().eq("id", post.id);

        if (!error) {
            window.location.reload();
        }
    };

    const isNSFW = post.content_rating === "nsfw";
    const shouldBlur = isNSFW && !showNSFW;

    const hasImages = post.images && post.images.length > 0;
    const hasMedia = post.media_url || hasImages || post.audio_url;

    const avatarSize = displaySize === "compact" ? "h-8 w-8" : displaySize === "expanded" ? "h-12 w-12" : "h-10 w-10";
    const textSize = displaySize === "compact" ? "text-xs" : displaySize === "expanded" ? "text-base" : "text-sm";
    const contentTextSize = displaySize === "compact" ? "text-sm" : displaySize === "expanded" ? "text-lg" : "text-base";
    const maxMediaHeight = displaySize === "compact" ? "200px" : displaySize === "expanded" ? "600px" : "500px";
    const lineClamp = displaySize === "compact" ? "line-clamp-3" : displaySize === "expanded" ? "" : "line-clamp-6";

    return (
        <Card
            className="overflow-hidden border-royal-purple/20 bg-card/50 backdrop-blur-sm hover:border-royal-purple/40 transition-all">
            <CardHeader className={displaySize === "compact" ? "pb-2" : "pb-3"}>
                <div className="flex items-center justify-between">
                    <Link
                        href={`/profile/${post.author_profile.id}`}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                        <Avatar className={`${avatarSize} border-2 border-royal-purple`}>
                            <AvatarImage src={post.author_profile.avatar_url || undefined}/>
                            <AvatarFallback className="bg-gradient-to-br from-royal-purple to-royal-blue text-white">
                                {post.author_profile.display_name?.[0]?.toUpperCase() || post.author_profile.username[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className={`font-semibold ${textSize}`}>{post.author_profile.display_name || post.author_profile.username}</p>
                            <p className={`${displaySize === "compact" ? "text-[10px]" : "text-xs"} text-muted-foreground`}>
                                {formatDistanceToNow(new Date(post.created_at), {addSuffix: true})}
                            </p>
                        </div>
                    </Link>
                    <div className="flex items-center gap-2">
                        {post.visibility === "friends_only" && (
                            <Badge variant="secondary"
                                   className="bg-royal-blue/20 text-royal-blue border-royal-blue/30 text-xs">
                                <Lock className="h-3 w-3 mr-1"/>
                                Friends
                            </Badge>
                        )}
                        {post.is_promotional && (
                            <Badge variant="secondary"
                                   className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs">
                                Promoted
                            </Badge>
                        )}
                        {isNSFW && (
                            <Badge variant="secondary"
                                   className="bg-destructive/20 text-destructive border-destructive/30 text-xs">
                                NSFW
                            </Badge>
                        )}
                        {currentUserId === post.author_profile.id && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={deletePost} className="text-destructive">
                                        Delete Post
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent
                className={displaySize === "compact" ? "pb-2" : displaySize === "expanded" ? "pb-6" : "pb-4"}
                onClick={() => router.push(`/posts/${post.id}`)}
            >
                {isPoll ? (
                    <PollDisplay
                        postId={post.id}
                        question={post.poll_question!}
                        options={post.poll_options!}
                        multipleChoice={post.poll_multiple_choice || false}
                        endDate={post.poll_end_date!}
                        authorId={post.author_profile.id}
                    />
                ) : (
                    <>
                        {/* Media Content */}
                        {hasMedia && (
                            <div className={displaySize === "compact" ? "mb-2" : "mb-3"} style={{position: "relative"}}>
                                {shouldBlur && (
                                    <div
                                        className="absolute inset-0 backdrop-blur-2xl bg-background/50 z-10 flex items-center justify-center rounded-lg">
                                        <Button
                                            onClick={() => setShowNSFW(true)}
                                            variant="outline"
                                            size={displaySize === "compact" ? "sm" : "default"}
                                            className="gap-2 bg-background/80 backdrop-blur-sm"
                                        >
                                            <Eye className="h-4 w-4"/>
                                            Show NSFW Content
                                        </Button>
                                    </div>
                                )}

                                {hasImages ? (
                                    <ImageCarousel images={post.images || []} className={shouldBlur ? "blur-2xl" : ""}/>
                                ) : post.media_type === "picture" && post.media_url ? (
                                    <div
                                        className="w-full rounded-lg overflow-hidden bg-black/5 flex items-center justify-center"
                                        style={{maxHeight: maxMediaHeight}}
                                    >
                                        <img
                                            src={post.media_url || "/placeholder.svg"}
                                            alt="Post media"
                                            className={`max-w-full max-h-full object-contain ${shouldBlur ? "blur-2xl" : ""}`}
                                            onContextMenu={(e) => e.preventDefault()}
                                            draggable={false}
                                            style={{userSelect: "none"}}
                                        />
                                    </div>
                                ) : post.media_type === "video" && post.media_url ? (
                                    <div
                                        className="relative w-full rounded-lg overflow-hidden bg-black/5 flex items-center justify-center"
                                        style={{maxHeight: maxMediaHeight}}
                                    >
                                        <video
                                            src={post.media_url}
                                            className={`max-w-full max-h-full object-contain ${shouldBlur ? "blur-2xl" : ""}`}
                                            muted
                                            loop
                                            playsInline
                                            controlsList="nodownload"
                                            onContextMenu={(e) => e.preventDefault()}
                                            onMouseEnter={(e) => e.currentTarget.play()}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.pause();
                                                e.currentTarget.currentTime = 0;
                                            }}
                                            style={{userSelect: "none"}}
                                        />
                                        <Play
                                            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${displaySize === "compact" ? "h-8 w-8" : "h-12 w-12"} text-white opacity-80 pointer-events-none`}
                                        />
                                    </div>
                                ) : post.audio_url ? (
                                    <div
                                        className={`bg-gradient-to-br from-royal-purple/10 to-royal-blue/10 ${displaySize === "compact" ? "p-3" : "p-6"} rounded-lg border border-royal-purple/20`}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <Volume2
                                                className={`${displaySize === "compact" ? "h-4 w-4" : "h-6 w-6"} text-royal-purple`}/>
                                            <span className={`font-semibold ${textSize}`}>Audio Post</span>
                                        </div>
                                        <audio src={post.audio_url} controls controlsList="nodownload"
                                               className="w-full"/>
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {/* Text Content */}
                        <p
                            className={`whitespace-pre-wrap leading-relaxed ${contentTextSize} ${lineClamp} ${shouldBlur ? "blur-sm" : ""}`}
                        >
                            {post.content}
                        </p>
                    </>
                )}
            </CardContent>

            <CardFooter className="pt-0 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleLike}
                        className={liked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground"}
                    >
                        <Heart className={`h-4 w-4 mr-1 ${liked ? "fill-current" : ""}`}/>
                        {likeCount}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                        <MessageCircle className="h-4 w-4 mr-1"/>
                        {commentCount}
                    </Button>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Share2 className="h-4 w-4"/>
                </Button>
            </CardFooter>
        </Card>
    );
}
