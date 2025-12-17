"use client";

import {formatDistanceToNow} from "date-fns";
import {Eye, Heart, MessageCircle, MoreHorizontal, Send, Share2, Volume2} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useCallback, useEffect, useState} from "react";

import {ImageCarousel} from "@/components/image-carousel";
import {PollDisplay} from "@/components/poll-display";
import {ReportDialog} from "@/components/report-dialog";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardFooter, CardHeader} from "@/components/ui/card";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {Input} from "@/components/ui/input";
import {createClient} from "@/lib/supabase/client";

interface PostDetailViewProps {
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
        poll_question?: string | null
        poll_options?: any[] | null
        poll_multiple_choice?: boolean | null
        poll_end_date?: string | null
        profiles: {
            id: string
            username: string
            display_name: string | null
            avatar_url: string | null
        }
    }
    currentUserId: string
}

interface Comment {
    id: string
    content: string
    created_at: string
    profiles: {
        id: string
        username: string
        display_name: string | null
        avatar_url: string | null
    }
}

export function PostDetailView({post, currentUserId}: PostDetailViewProps) {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [showNSFW, setShowNSFW] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const isPoll = post.media_type === "poll" && post.poll_question && post.poll_options;

    const loadPostStats = useCallback(async () => {
        const {count: likes} = await supabase.from("post_likes").select("id", {count: "exact"}).eq("post_id", post.id);

        const {data: userLike} = await supabase
            .from("post_likes")
            .select("id")
            .eq("post_id", post.id)
            .eq("user_id", currentUserId)
            .single();

        setLiked(!!userLike);
        setLikeCount(likes || 0);
    }, [post.id, currentUserId, supabase]);

    const loadComments = useCallback(async () => {
        const {data} = await supabase
            .from("comments")
            .select(
                `
                id,
                content,
                created_at,
                profiles (
                    id,
                    username,
                    display_name,
                    avatar_url
                )
                `
            )
            .eq("post_id", post.id)
            .order("created_at", {ascending: true});

        if (data) {
            setComments(data as Comment[]);
        }
    }, [post.id, supabase]);

    const toggleLike = useCallback(async () => {
        if (liked) {
            await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", currentUserId);
            setLiked(false);
            setLikeCount(prev => Math.max(0, prev - 1));
        } else {
            await supabase.from("post_likes").insert({post_id: post.id, user_id: currentUserId});
            setLiked(true);
            setLikeCount(prev => prev + 1);
        }
    }, [liked, post.id, currentUserId, supabase]);

    useEffect(() => {
        const handlePopState = () => {
            loadPostStats();
            loadComments();
        };

        window.addEventListener("popstate", handlePopState);
        loadPostStats();
        loadComments();

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [loadPostStats, loadComments]);

    const deletePost = async () => {
        if (!confirm("Are you sure you want to delete this post?")) {
            return;
        }

        const {error} = await supabase.from("posts").delete().eq("id", post.id);

        if (!error) {
            router.push("/feed");
        }
    };

    const submitComment = async () => {
        if (!newComment.trim()) {
            return;
        }

        if (!currentUserId) {
            console.error("[v0] Cannot submit comment: currentUserId is missing");
            alert("You must be logged in to comment");
            return;
        }

        console.log("[v0] Submitting comment:", {post_id: post.id, user_id: currentUserId, content: newComment});

        const {data, error} = await supabase
            .from("comments")
            .insert({
                post_id: post.id,
                user_id: currentUserId,
                content: newComment,
            })
            .select();

        if (error) {
            console.error("[v0] Comment submission error:", error);
            alert(`Failed to post comment: ${error.message}`);
        } else {
            console.log("[v0] Comment posted successfully:", data);
            setNewComment("");
            loadComments();
        }
    };

    const isNSFW = post.content_rating === "nsfw";
    const shouldBlur = isNSFW && !showNSFW;

    const hasImages = Array.isArray(post.images) && post.images.length > 0;
    const hasMedia = post.media_url || hasImages || post.audio_url;

    return (
        <div className="container mx-auto max-w-4xl p-4 pt-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2">
                    <Card className="overflow-hidden border-royal-purple/20 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <Link
                                    href={`/profile/${post.profiles.id}`}
                                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                                >
                                    <Avatar className="h-12 w-12 border-2 border-royal-purple">
                                        <AvatarImage src={post.profiles.avatar_url || undefined}/>
                                        <AvatarFallback
                                            className="bg-linear-to-br from-royal-purple to-royal-blue text-white">
                                            {post.profiles.display_name?.[0]?.toUpperCase() || post.profiles.username[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{post.profiles.display_name || post.profiles.username}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(post.created_at), {addSuffix: true})}
                                        </p>
                                    </div>
                                </Link>
                                <div className="flex items-center gap-2">
                                    {post.is_promotional && (
                                        <Badge variant="secondary"
                                               className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                                            Promoted
                                        </Badge>
                                    )}
                                    {isNSFW && (
                                        <Badge variant="secondary"
                                               className="bg-destructive/20 text-destructive border-destructive/30">
                                            NSFW
                                        </Badge>
                                    )}
                                    {currentUserId === post.profiles.id ? (
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
                                    ) : (
                                        <ReportDialog contentType="post" contentId={post.id}/>
                                    )}
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="pb-4">
                            {isPoll ? (
                                <PollDisplay
                                    postId={post.id}
                                    question={post.poll_question!}
                                    options={post.poll_options!}
                                    multipleChoice={post.poll_multiple_choice || false}
                                    endDate={post.poll_end_date!}
                                    authorId={post.profiles.id}
                                />
                            ) : (
                                <>
                                    {/* Media Content */}
                                    {hasMedia && (
                                        <div className="mb-4 relative">
                                            {shouldBlur && (
                                                <div
                                                    className="absolute inset-0 backdrop-blur-2xl bg-background/50 z-10 flex items-center justify-center rounded-lg">
                                                    <Button
                                                        onClick={() => setShowNSFW(true)}
                                                        variant="outline"
                                                        className="gap-2 bg-background/80 backdrop-blur-sm"
                                                    >
                                                        <Eye className="h-4 w-4"/>
                                                        Show NSFW Content
                                                    </Button>
                                                </div>
                                            )}

                                            {hasImages ? (
                                                <ImageCarousel images={post.images || []}
                                                               className={shouldBlur ? "blur-2xl" : ""}/>
                                            ) : post.media_type === "picture" && post.media_url ? (
                                                <div
                                                    className="w-full rounded-lg overflow-hidden bg-black/5 flex items-center justify-center">
                                                    <img
                                                        src={post.media_url || "/placeholder.svg"}
                                                        alt="Post media"
                                                        className={`w-full object-contain ${shouldBlur ? "blur-2xl" : ""}`}
                                                        style={{maxHeight: "600px"}}
                                                    />
                                                </div>
                                            ) : post.media_type === "video" && post.media_url ? (
                                                <div className="relative w-full rounded-lg overflow-hidden bg-black/5">
                                                    <video
                                                        src={post.media_url}
                                                        controls
                                                        className={`w-full object-contain ${shouldBlur ? "blur-2xl" : ""}`}
                                                        style={{maxHeight: "600px"}}
                                                    />
                                                </div>
                                            ) : post.audio_url ? (
                                                <div
                                                    className="bg-linear-to-br from-royal-purple/10 to-royal-blue/10 p-6 rounded-lg border border-royal-purple/20">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <Volume2 className="h-6 w-6 text-royal-purple"/>
                                                        <span className="font-semibold">Audio Post</span>
                                                    </div>
                                                    <audio src={post.audio_url} controls className="w-full"/>
                                                </div>
                                            ) : null}
                                        </div>
                                    )}

                                    {/* Text Content */}
                                    <p className={`whitespace-pre-wrap leading-relaxed text-lg ${shouldBlur ? "blur-sm" : ""}`}>
                                        {post.content}
                                    </p>
                                </>
                            )}
                        </CardContent>

                        <CardFooter
                            className="flex items-center justify-between border-t border-royal-purple/20 pt-4">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleLike}
                                    className={liked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground"}
                                >
                                    <Heart className={`h-5 w-5 mr-1 ${liked ? "fill-current" : ""}`}/>
                                    {likeCount}
                                </Button>
                                <Button variant="ghost" size="sm"
                                        className="text-muted-foreground hover:text-foreground">
                                    <MessageCircle className="h-5 w-5 mr-1"/>
                                    {comments.length}
                                </Button>
                            </div>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                <Share2 className="h-5 w-5"/>
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Comments Section */}
                    <Card className="mt-6 border-royal-purple/20 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <h3 className="font-semibold text-lg">Comments ({comments.length})</h3>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <Link href={`/profile/${comment.profiles.id}`}>
                                        <Avatar className="h-10 w-10 border-2 border-royal-purple">
                                            <AvatarImage src={comment.profiles.avatar_url || undefined}/>
                                            <AvatarFallback
                                                className="bg-linear-to-br from-royal-purple to-royal-blue text-white">
                                                {comment.profiles.display_name?.[0]?.toUpperCase() ||
                                                    comment.profiles.username[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <div className="flex-1">
                                        <div className="bg-muted/50 rounded-lg p-3">
                                            <Link href={`/profile/${comment.profiles.id}`}
                                                  className="font-semibold text-sm hover:underline">
                                                {comment.profiles.display_name || comment.profiles.username}
                                            </Link>
                                            <p className="text-sm mt-1">{comment.content}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 ml-3">
                                            {formatDistanceToNow(new Date(comment.created_at), {addSuffix: true})}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {comments.length === 0 && (
                                <p className="text-center text-muted-foreground py-8">No comments yet. Be the first to
                                    comment!</p>
                            )}

                            {/* Add Comment */}
                            <div className="flex gap-3 pt-4 border-t border-royal-purple/20">
                                <Avatar className="h-10 w-10 border-2 border-royal-purple">
                                    <AvatarFallback
                                        className="bg-linear-to-br from-royal-purple to-royal-blue text-white">
                                        You
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 flex gap-2">
                                    <Input
                                        placeholder="Write a comment..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                submitComment();
                                            }
                                        }}
                                    />
                                    <Button onClick={submitComment} size="icon" disabled={!newComment.trim()}>
                                        <Send className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <Card className="border-royal-purple/20 bg-card/50 backdrop-blur-sm sticky top-4">
                        <CardHeader>
                            <h3 className="font-semibold">About this post</h3>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Posted by</p>
                                <Link
                                    href={`/profile/${post.profiles.id}`}
                                    className="font-semibold hover:text-royal-purple transition-colors"
                                >
                                    {post.profiles.display_name || post.profiles.username}
                                </Link>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Posted</p>
                                <p className="font-semibold">{formatDistanceToNow(new Date(post.created_at), {addSuffix: true})}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Engagement</p>
                                <div className="flex gap-4 mt-1">
                  <span className="text-sm">
                    <Heart className="h-4 w-4 inline mr-1"/>
                      {likeCount}
                  </span>
                                    <span className="text-sm">
                    <MessageCircle className="h-4 w-4 inline mr-1"/>
                                        {comments.length}
                  </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
