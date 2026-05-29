"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Trash2, Eye, Image, Video, Music, FileText, AlertTriangle, X } from "lucide-react";

interface MediaItem {
    id: string;
    owner_id: string;
    url: string;
    type: string;
    content_rating: string;
    title: string | null;
    description: string | null;
    created_at: string;
    deleted_at: string | null;
    profiles: {
        username: string;
        display_name: string;
    };
    reports_count?: number;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    picture: Image,
    image: Image,
    video: Video,
    audio: Music,
    writing: FileText,
    file: FileText,
};

export default function AdminMediaPage() {
    const supabase = createBrowserClient();
    const [isAdmin, setIsAdmin] = useState(false);
    const [checking, setChecking] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
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

    const { data: mediaItems, isLoading, refetch } = useQuery<MediaItem[]>({
        queryKey: ["admin", "media"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("media")
                .select(`
                    *,
                    profiles!inner(username, display_name)
                `)
                .order("created_at", { ascending: false })
                .limit(200);

            if (error) throw error;

            const enriched = await Promise.all(
                (data || []).map(async (item: any) => {
                    const { count } = await supabase
                        .from("reports")
                        .select("id", { count: "exact", head: true })
                        .eq("content_type", "media")
                        .eq("content_id", item.id);
                    return { ...item, reports_count: count ?? 0 };
                })
            );

            return enriched;
        },
        enabled: isAdmin,
        refetchInterval: 30_000,
    });

    const handleDelete = async () => {
        if (!selectedMedia) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from("media")
            .update({
                deleted_at: new Date().toISOString(),
                moderation_notes: `Deleted by admin: ${deleteReason || "No reason provided"}`,
            })
            .eq("id", selectedMedia.id);

        if (error) {
            toast.error("Failed to delete media");
        } else {
            toast.success("Media deleted successfully");
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

    const filtered = mediaItems?.filter((m) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            m.title?.toLowerCase().includes(q) ||
            m.description?.toLowerCase().includes(q) ||
            m.type?.toLowerCase().includes(q) ||
            m.profiles?.username?.toLowerCase().includes(q)
        );
    });

    const activeCount = filtered?.filter(m => !m.deleted_at).length ?? 0;
    const deletedCount = filtered?.filter(m => m.deleted_at).length ?? 0;

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Media Moderation</h1>
                    <p className="text-muted-foreground">Review and moderate uploaded media content</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Media</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{mediaItems?.length ?? 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-royal-green">{activeCount}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Deleted</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-destructive">{deletedCount}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search media by title, type, or username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            <Card className="border-royal-purple/20 bg-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        Media Library
                    </CardTitle>
                    <CardDescription>
                        All uploaded media. Click to view details and moderate.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <Skeleton key={i} className="aspect-square rounded-lg" />
                            ))}
                        </div>
                    ) : filtered && filtered.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filtered.map((media) => {
                                const TypeIcon = typeIcons[media.type] || FileText;
                                const isVideo = media.type === "video";
                                const isAudio = media.type === "audio";
                                const isImage = media.type === "picture" || media.type === "image";

                                return (
                                    <div
                                        key={media.id}
                                        className={`relative group rounded-lg overflow-hidden border cursor-pointer hover:ring-2 hover:ring-royal-purple transition-all ${
                                            media.deleted_at ? "opacity-40 grayscale" : "border-royal-purple/10 bg-card/50"
                                        }`}
                                        onClick={() => {
                                            setSelectedMedia(media);
                                            setDetailOpen(true);
                                        }}
                                    >
                                        {isImage ? (
                                            <div className="aspect-square">
                                                <img
                                                    src={media.url}
                                                    alt={media.title || ""}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            </div>
                                        ) : (
                                            <div className="aspect-square flex items-center justify-center bg-muted/30">
                                                <TypeIcon className="h-10 w-10 text-muted-foreground" />
                                            </div>
                                        )}

                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="secondary" className="text-[10px]">
                                                    {media.type}
                                                </Badge>
                                                {media.content_rating === "nsfw" && (
                                                    <Badge variant="destructive" className="text-[10px]">
                                                        NSFW
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-white mt-1 truncate">
                                                @{media.profiles?.username || "unknown"}
                                            </p>
                                        </div>

                                        {media.reports_count ? (
                                            <Badge variant="destructive" className="absolute top-2 right-2 text-[10px]">
                                                {media.reports_count} report{media.reports_count > 1 ? "s" : ""}
                                            </Badge>
                                        ) : null}

                                        {media.deleted_at && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Badge variant="destructive">Deleted</Badge>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-center py-8 text-muted-foreground">No media found</p>
                    )}
                </CardContent>
            </Card>

            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Media Details</DialogTitle>
                        <DialogDescription>
                            View and moderate uploaded media content
                        </DialogDescription>
                    </DialogHeader>

                    {selectedMedia && (
                        <div className="space-y-4">
                            {selectedMedia.type === "picture" || selectedMedia.type === "image" ? (
                                <div className="relative rounded-lg overflow-hidden bg-muted/30">
                                    <img
                                        src={selectedMedia.url}
                                        alt={selectedMedia.title || ""}
                                        className="w-full max-h-96 object-contain"
                                    />
                                </div>
                            ) : selectedMedia.type === "video" ? (
                                <div className="rounded-lg overflow-hidden bg-muted/30">
                                    <video src={selectedMedia.url} controls className="w-full max-h-96" />
                                </div>
                            ) : (
                                <div className="p-8 bg-muted/30 rounded-lg text-center">
                                    <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground mt-2">Preview not available for this media type</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Owner</Label>
                                    <p className="text-sm">
                                        {selectedMedia.profiles?.display_name} (@{selectedMedia.profiles?.username})
                                    </p>
                                </div>
                                <div>
                                    <Label>Type</Label>
                                    <Badge variant="secondary" className="mt-1">{selectedMedia.type}</Badge>
                                </div>
                                <div>
                                    <Label>Content Rating</Label>
                                    <Badge variant={selectedMedia.content_rating === "nsfw" ? "destructive" : "secondary"} className="mt-1">
                                        {selectedMedia.content_rating?.toUpperCase() || "SFW"}
                                    </Badge>
                                </div>
                                <div>
                                    <Label>Reports</Label>
                                    <p className="text-sm mt-1">{selectedMedia.reports_count ?? 0}</p>
                                </div>
                            </div>

                            {selectedMedia.title && (
                                <div>
                                    <Label>Title</Label>
                                    <p className="text-sm">{selectedMedia.title}</p>
                                </div>
                            )}

                            {selectedMedia.description && (
                                <div>
                                    <Label>Description</Label>
                                    <p className="text-sm text-muted-foreground">{selectedMedia.description}</p>
                                </div>
                            )}

                            <div className="text-xs text-muted-foreground">
                                Uploaded: {new Date(selectedMedia.created_at).toLocaleString()}
                            </div>

                            <div>
                                <Label>URL</Label>
                                <p className="text-xs font-mono text-muted-foreground break-all mt-1 bg-muted/30 p-2 rounded">
                                    {selectedMedia.url}
                                </p>
                            </div>

                            {!selectedMedia.deleted_at && (
                                <div className="flex gap-2 justify-end pt-2 border-t">
                                    <Button
                                        variant="destructive"
                                        onClick={() => setDeleteConfirmOpen(true)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Media
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
                            Confirm Media Deletion
                        </DialogTitle>
                        <DialogDescription>
                            This will soft-delete the media. It will no longer be visible to users.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="media-delete-reason">Reason for deletion</Label>
                            <Textarea
                                id="media-delete-reason"
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                placeholder="Why is this media being removed?"
                                className="mt-1"
                            />
                        </div>

                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDelete}>
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
