"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { createBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Eye, Trash2, Search, FileText, AlertTriangle, X } from "lucide-react";

interface Post {
    id: string;
    author_id: string;
    content: string;
    content_rating: string;
    is_promotional: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    profiles: {
        username: string;
        display_name: string;
    };
    reports_count?: number;
}

interface PostDetail extends Post {
    comments_count: number;
    likes_count: number;
    media: { id: string; url: string; type: string }[];
    tags: string[];
}

export default function AdminManagePostsPage() {
    const supabase = createBrowserClient();
    const [isAdmin, setIsAdmin] = useState(false);
    const [checking, setChecking] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPost, setSelectedPost] = useState<PostDetail | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteReason, setDeleteReason] = useState("");

    useEffect(() => {
        async function check() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("is_admin")
                    .eq("id", user.id)
                    .single();
                setIsAdmin(profile?.is_admin ?? false);
            }
            setChecking(false);
        }
        check();
    }, []);

    const { data: posts, isLoading, refetch } = useQuery<Post[]>({
        queryKey: ["admin", "posts"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("posts")
                .select(`
                    *,
                    profiles!inner(username, display_name)
                `)
                .order("created_at", { ascending: false })
                .limit(200);

            if (error) throw error;

            const enriched = await Promise.all(
                (data || []).map(async (post: any) => {
                    const { count } = await supabase
                        .from("reports")
                        .select("id", { count: "exact", head: true })
                        .eq("content_type", "post")
                        .eq("content_id", post.id);
                    return { ...post, reports_count: count ?? 0 };
                })
            );

            return enriched;
        },
        enabled: isAdmin,
        refetchInterval: 30_000,
    });

    const fetchPostDetail = useCallback(async (postId: string): Promise<PostDetail> => {
        const { data: post } = await supabase
            .from("posts")
            .select("*, profiles!inner(username, display_name)")
            .eq("id", postId)
            .single();

        const { count: commentsCount } = await supabase
            .from("comments")
            .select("id", { count: "exact", head: true })
            .eq("post_id", postId);

        const { data: media } = await supabase
            .from("post_media")
            .select("media:media_id(id, url, type)")
            .eq("post_id", postId);

        const { data: tags } = await supabase
            .from("post_tags")
            .select("tag:tag_id(name)")
            .eq("post_id", postId);

        return {
            ...(post as any),
            comments_count: commentsCount ?? 0,
            likes_count: 0,
            media: (media || []).map((m: any) => m.media).filter(Boolean),
            tags: (tags || []).map((t: any) => t.tag?.name).filter(Boolean),
        };
    }, [supabase]);

    const handleViewPost = async (postId: string) => {
        try {
            const detail = await fetchPostDetail(postId);
            setSelectedPost(detail);
            setDetailOpen(true);
        } catch {
            toast.error("Failed to load post details");
        }
    };

    const handleSoftDelete = async () => {
        if (!selectedPost) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from("posts")
            .update({
                deleted_at: new Date().toISOString(),
                moderation_notes: `Deleted by admin: ${deleteReason || "No reason provided"}`,
                moderated_by: user.id,
            })
            .eq("id", selectedPost.id);

        if (error) {
            toast.error("Failed to delete post");
        } else {
            toast.success("Post soft-deleted successfully");
            setDeleteConfirmOpen(false);
            setDetailOpen(false);
            setDeleteReason("");
            refetch();
        }
    };

    if (checking) {
        return (
            <div className="container mx-auto p-6">
                <Skeleton className="h-8 w-48" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="container mx-auto p-6">
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">Admin access required.</p>
            </div>
        );
    }

    const filteredPosts = posts?.filter((p) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            p.content?.toLowerCase().includes(q) ||
            p.profiles?.username?.toLowerCase().includes(q) ||
            p.profiles?.display_name?.toLowerCase().includes(q)
        );
    });

    const activePosts = filteredPosts?.filter(p => !p.deleted_at) ?? [];
    const deletedPosts = filteredPosts?.filter(p => p.deleted_at) ?? [];

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Post Management</h1>
                    <p className="text-muted-foreground">View, review, and moderate platform posts</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{posts?.length ?? 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-royal-green">{activePosts.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Deleted</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-destructive">{deletedPosts.length}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search posts by content, username, or display name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            <Card className="border-royal-purple/20 bg-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        All Posts
                    </CardTitle>
                    <CardDescription>
                        Posts ordered by most recent first. Click "View" to see full content.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-16" />
                            ))}
                        </div>
                    ) : filteredPosts && filteredPosts.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Author</TableHead>
                                    <TableHead>Content</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>Reports</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPosts.map((post) => (
                                    <TableRow key={post.id} className={post.deleted_at ? "opacity-50" : ""}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {post.profiles?.display_name || "Unknown"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    @{post.profiles?.username || "unknown"}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm line-clamp-2 max-w-xs">
                                                {post.content || "(no text content)"}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={post.content_rating === "nsfw" ? "destructive" : "secondary"} className="text-xs">
                                                {post.content_rating?.toUpperCase() || "SFW"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {post.reports_count ? (
                                                <Badge variant="destructive" className="text-xs">
                                                    {post.reports_count}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">0</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={post.deleted_at ? "destructive" : "default"} className="text-xs">
                                                {post.deleted_at ? "Deleted" : "Active"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(post.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleViewPost(post.id)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center py-8 text-muted-foreground">No posts found</p>
                    )}
                </CardContent>
            </Card>

            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Post Details</DialogTitle>
                        <DialogDescription>
                            Full post content and metadata
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPost && (
                        <div className="space-y-4">
                            <div>
                                <Label>Author</Label>
                                <p className="text-sm">
                                    {selectedPost.profiles?.display_name} (@{selectedPost.profiles?.username})
                                </p>
                            </div>

                            <div>
                                <Label>Content</Label>
                                <div className="mt-1 p-4 rounded-lg bg-muted/50 whitespace-pre-wrap text-sm max-h-60 overflow-y-auto">
                                    {selectedPost.content || "(empty)"}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Content Rating</Label>
                                    <Badge variant={selectedPost.content_rating === "nsfw" ? "destructive" : "secondary"} className="mt-1">
                                        {selectedPost.content_rating?.toUpperCase() || "SFW"}
                                    </Badge>
                                </div>
                                <div>
                                    <Label>Promotional</Label>
                                    <Badge variant={selectedPost.is_promotional ? "default" : "outline"} className="mt-1">
                                        {selectedPost.is_promotional ? "Yes" : "No"}
                                    </Badge>
                                </div>
                            </div>

                            {selectedPost.tags && selectedPost.tags.length > 0 && (
                                <div>
                                    <Label>Tags</Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {selectedPost.tags.map((tag: string, i: number) => (
                                            <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedPost.media && selectedPost.media.length > 0 && (
                                <div>
                                    <Label>Media ({selectedPost.media.length})</Label>
                                    <div className="grid grid-cols-3 gap-2 mt-1">
                                        {selectedPost.media.map((m: any, i: number) => (
                                            <div key={i} className="relative aspect-square rounded overflow-hidden bg-muted">
                                                <img
                                                    src={m.url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                                <Badge className="absolute bottom-1 left-1 text-[10px]">
                                                    {m.type}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{selectedPost.comments_count ?? 0} comments</span>
                                <span>Created: {new Date(selectedPost.created_at).toLocaleString()}</span>
                                {selectedPost.updated_at !== selectedPost.created_at && (
                                    <span>Edited: {new Date(selectedPost.updated_at).toLocaleString()}</span>
                                )}
                            </div>

                            {!selectedPost.deleted_at && (
                                <div className="flex gap-2 justify-end pt-2 border-t">
                                    <Button
                                        variant="destructive"
                                        onClick={() => setDeleteConfirmOpen(true)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Post
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Confirm Post Deletion
                        </DialogTitle>
                        <DialogDescription>
                            This will soft-delete the post. It will no longer be visible to users but remains in the database.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="delete-reason">Reason for deletion</Label>
                            <Textarea
                                id="delete-reason"
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                placeholder="Why is this post being removed?"
                                className="mt-1"
                            />
                        </div>

                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleSoftDelete}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Confirm Delete
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
