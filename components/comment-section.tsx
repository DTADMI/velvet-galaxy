"use client";

import {formatDistanceToNow} from "date-fns";
import {Heart, MessageCircle, Trash2} from "lucide-react";
import {useCallback, useEffect, useState} from "react";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {createClient} from "@/lib/supabase/client";

interface Comment {
    id: string
    user_id: string
    content: string
    created_at: string
    parent_comment_id: string | null
    profiles: {
        username: string
        display_name: string | null
        avatar_url: string | null
    }
    comment_likes: { user_id: string }[]
    replies?: Comment[]
}

interface CommentSectionProps {
    contentType: "post"
    contentId: string
    currentUserId: string
}

export function CommentSection({contentType: _contentType, contentId, currentUserId}: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const supabase = createClient();

    const fetchComments = useCallback(async () => {
        const {data, error} = await supabase
            .from("comments")
            .select(`
        *,
        profiles(username, display_name, avatar_url),
        comment_likes(user_id)
      `)
            .eq("post_id", contentId)
            .is("parent_comment_id", null)
            .order("created_at", {ascending: false});

        if (data) {
            // Fetch replies for each comment
            const commentsWithReplies = await Promise.all(
                data.map(async (comment: Comment) => {
                    const {data: replies} = await supabase
                        .from("comments")
                        .select(`
              *,
              profiles(username, display_name, avatar_url),
              comment_likes(user_id)
            `)
                        .eq("parent_comment_id", comment.id)
                        .order("created_at", {ascending: true});

                    return {...comment, replies: replies || []};
                }),
            );
            setComments(commentsWithReplies);
        }
    }, [contentId, supabase]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleAddComment = async () => {
        if (!newComment.trim()) {
            return;
        }

        if (!currentUserId) {
            console.error("[v0] Cannot add comment: currentUserId is missing");
            return;
        }

        console.log("[v0] Submitting comment:", {user_id: currentUserId, post_id: contentId, content: newComment});

        const {data, error: _error} = await supabase
            .from("comments")
            .insert({
                user_id: currentUserId,
                post_id: contentId,
                content: newComment,
            })
            .select();

        if (_error) {
            console.error("[v0] Comment submission error:", _error);
            alert(`Failed to post comment: ${error.message}`);
        } else {
            console.log("[v0] Comment posted successfully:", data);
            setNewComment("");
            fetchComments();
        }
    };

    const handleAddReply = async (parentId: string) => {
        if (!replyContent.trim()) {
            return;
        }

        if (!currentUserId) {
            console.error("[v0] Cannot add reply: currentUserId is missing");
            return;
        }

        console.log("[v0] Submitting reply:", {
            user_id: currentUserId,
            post_id: contentId,
            content: replyContent,
            parent_comment_id: parentId,
        });

        const {data, error} = await supabase
            .from("comments")
            .insert({
                user_id: currentUserId,
                post_id: contentId,
                content: replyContent,
                parent_comment_id: parentId,
            })
            .select();

        if (error) {
            console.error("[v0] Reply submission error:", error);
            alert(`Failed to post reply: ${error.message}`);
        } else {
            console.log("[v0] Reply posted successfully:", data);
            setReplyContent("");
            setReplyTo(null);
            fetchComments();
        }
    };

    const handleLikeComment = async (commentId: string, isLiked: boolean) => {
        if (isLiked) {
            await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", currentUserId);
        } else {
            await supabase.from("comment_likes").insert({
                comment_id: commentId,
                user_id: currentUserId,
            });
        }
        fetchComments();
    };

    const handleDeleteComment = async (commentId: string) => {
        await supabase.from("comments").delete().eq("id", commentId);
        fetchComments();
    };

    const renderComment = (comment: Comment, isReply = false) => {
        const isLiked = comment.comment_likes.some((like) => like.user_id === currentUserId);
        const likesCount = comment.comment_likes.length;
        const displayName = comment.profiles.display_name || comment.profiles.username;

        return (
            <div key={comment.id} className={`${isReply ? "ml-12 mt-4" : "mt-6"}`}>
                <div className="flex gap-3">
                    <Avatar className="h-10 w-10 border-2 border-royal-blue">
                        <AvatarImage src={comment.profiles.avatar_url || undefined}/>
                        <AvatarFallback className="bg-gradient-to-br from-royal-blue to-royal-purple text-white">
                            {displayName[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="bg-card rounded-lg p-4 border border-border">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-foreground">{displayName}</span>
                                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), {addSuffix: true})}
                </span>
                            </div>
                            <p className="text-foreground text-sm leading-relaxed">{comment.content}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-2 ml-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLikeComment(comment.id, isLiked)}
                                className="text-xs gap-1 hover:text-royal-auburn"
                            >
                                <Heart className={`h-4 w-4 ${isLiked ? "fill-royal-auburn text-royal-auburn" : ""}`}/>
                                {likesCount > 0 && <span>{likesCount}</span>}
                            </Button>
                            {!isReply && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                                    className="text-xs gap-1 hover:text-royal-blue"
                                >
                                    <MessageCircle className="h-4 w-4"/>
                                    Reply
                                </Button>
                            )}
                            {comment.user_id === currentUserId && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-xs gap-1 hover:text-red-500"
                                >
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            )}
                        </div>
                        {replyTo === comment.id && (
                            <div className="mt-3 ml-2">
                                <Textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Write a reply..."
                                    className="mb-2 bg-background border-border"
                                    rows={2}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleAddReply(comment.id)}
                                        size="sm"
                                        className="bg-gradient-to-r from-royal-blue to-royal-purple"
                                    >
                                        Reply
                                    </Button>
                                    <Button onClick={() => setReplyTo(null)} size="sm" variant="outline">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2">{comment.replies.map((reply) => renderComment(reply, true))}</div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="mb-3 bg-background border-border"
                    rows={3}
                />
                <Button onClick={handleAddComment} className="bg-gradient-to-r from-royal-blue to-royal-purple">
                    Post Comment
                </Button>
            </div>
            <div className="space-y-4">
                {comments.map((comment) => renderComment(comment))}
                {comments.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No comments yet. Be the first to comment!</p>
                )}
            </div>
        </div>
    );
}
