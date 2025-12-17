"use client";

import {formatDistanceToNow} from "date-fns";
import {Bookmark, Heart, Share2} from "lucide-react";
import {useCallback, useEffect, useState} from "react";

import {CommentSection} from "@/components/comment-section";
import {ShareDialog} from "@/components/share-dialog";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {createClient} from "@/lib/supabase/client";

interface PostDetailViewProps {
    post: any
    currentUserId: string
}

export function PostDetailView({post, currentUserId}: PostDetailViewProps) {
    const supabase = createClient();
    const [isLiked, setIsLiked] = useState(post.post_likes?.some((like: {
        user_id: string
    }) => like.user_id === currentUserId) || false);
    const [likesCount, setLikesCount] = useState(post.post_likes?.length || 0);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);

    const loadPostData = useCallback(async () => {
        const {data: likes} = await supabase.from("post_likes").select("user_id").eq("post_id", post.id);

        if (likes) {
            setLikesCount(likes.length);
            setIsLiked(likes.some((like: { user_id: string }) => like.user_id === currentUserId));
        }
    }, [currentUserId, post.id, supabase]);

    useEffect(() => {
        const handlePopState = () => {
            // Reload data when browser back/forward is used
            loadPostData();
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [loadPostData]);

    const handleLike = async () => {
        if (isLiked) {
            await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", currentUserId);
            setLikesCount((prev) => prev - 1);
        } else {
            await supabase.from("post_likes").insert({post_id: post.id, user_id: currentUserId});
            setLikesCount((prev) => prev + 1);
        }
        setIsLiked(!isLiked);
    };

    const handleBookmark = async () => {
        if (isBookmarked) {
            await supabase
                .from("bookmarks")
                .delete()
                .eq("content_type", "post")
                .eq("content_id", post.id)
                .eq("user_id", currentUserId);
        } else {
            await supabase.from("bookmarks").insert({
                user_id: currentUserId,
                content_type: "post",
                content_id: post.id,
            });
        }
        setIsBookmarked(!isBookmarked);
    };

    return (
        <div className="min-h-screen bg-background pt-20">
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-card rounded-xl border border-border p-6 mb-6">
                    <div className="flex items-start gap-4 mb-4">
                        <Avatar className="h-12 w-12 border-2 border-royal-blue">
                            <AvatarImage src={post.profiles.avatar_url || undefined}/>
                            <AvatarFallback className="bg-gradient-to-br from-royal-blue to-royal-purple text-white">
                                {post.profiles.display_name[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-foreground">{post.profiles.display_name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {formatDistanceToNow(new Date(post.created_at), {addSuffix: true})}
                                    </p>
                                </div>
                                {post.content_rating === "nsfw" && (
                                    <Badge variant="destructive" className="bg-red-600">
                                        NSFW
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <p className="text-foreground leading-relaxed mb-4">{post.content}</p>

                    {post.media_url && (
                        <div className="mb-4 rounded-lg overflow-hidden">
                            {post.media_type === "image" && (
                                <img src={post.media_url || "/placeholder.svg"} alt="Post media" className="w-full"/>
                            )}
                            {post.media_type === "video" && <video src={post.media_url} controls className="w-full"/>}
                            {post.media_type === "audio" && <audio src={post.media_url} controls className="w-full"/>}
                        </div>
                    )}

                    <div className="flex items-center gap-4 pt-4 border-t border-border">
                        <Button variant="ghost" size="sm" onClick={handleLike}
                                className="gap-2 hover:text-royal-orange">
                            <Heart className={`h-5 w-5 ${isLiked ? "fill-royal-orange text-royal-orange" : ""}`}/>
                            <span>{likesCount}</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShareOpen(true)}
                            className="gap-2 hover:text-royal-blue"
                        >
                            <Share2 className="h-5 w-5"/>
                            Share
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleBookmark}
                                className="gap-2 hover:text-yellow-500">
                            <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-yellow-500 text-yellow-500" : ""}`}/>
                        </Button>
                    </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-xl font-bold mb-6 text-foreground">Comments</h2>
                    <CommentSection contentType="post" contentId={post.id} currentUserId={currentUserId}/>
                </div>
            </div>

            <ShareDialog
                open={shareOpen}
                onOpenChange={setShareOpen}
                contentType="post"
                contentId={post.id}
                currentUserId={currentUserId}
            />
        </div>
    );
}
