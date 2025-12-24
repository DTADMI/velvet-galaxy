"use client";

import {
    AlertTriangle,
    BarChart3,
    FileText,
    Globe,
    ImageIcon,
    ImagePlus,
    Loader2,
    Lock,
    Megaphone,
    Music,
    Tag,
    Upload,
    Video,
    X
} from "lucide-react";
import type React from "react";
import {useEffect, useRef, useState} from "react";
import {toast} from "sonner";

import {MultiImageUploadDialog} from "@/components/multi-image-upload-dialog";
import {PollCreator} from "@/components/poll-creator";
import {RichTextEditor} from "@/components/rich-text-editor";
import {SoundtrackLibrary} from "@/components/soundtrack-library";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Checkbox} from "@/components/ui/checkbox";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {createClient} from "@/lib/supabase/client";

interface EnhancedCreatePostProps {
    userProfile: {
        id: string
        username: string
        display_name: string | null
        avatar_url: string | null
    }
    onPostCreated: () => void
    isPremium?: boolean
}

export function EnhancedCreatePost({userProfile, onPostCreated, isPremium = false}: EnhancedCreatePostProps) {
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isPollDialogOpen, setIsPollDialogOpen] = useState(false);
    const [mediaType, setMediaType] = useState<"picture" | "gif" | "video" | "audio" | "writing">("picture");
    const [mediaTitle, setMediaTitle] = useState("");
    const [mediaDescription, setMediaDescription] = useState("");
    const [mediaUrl, setMediaUrl] = useState("");
    const [contentRating, setContentRating] = useState<"sfw" | "nsfw">("sfw");
    const [visibility, setVisibility] = useState<"everyone" | "friends_only">("everyone");
    const [commentScope, setCommentScope] = useState<"everyone" | "friends" | "followers">("everyone");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPromotional, setIsPromotional] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const [isScopeDialogOpen, setIsScopeDialogOpen] = useState(false);
    const [selectedSoundtrack, setSelectedSoundtrack] = useState<string | null>(null);
    const [multiImageDialogOpen, setMultiImageDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const statusFileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const characterLimit = isPremium ? 400 : 200;
    const isOverLimit = content.length > characterLimit && mediaType !== "writing";

    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput("");
        }
    };

    const removeTag = (tag: string) => {
        setTags(tags.filter((t) => t !== tag));
    };

    const handleStatusPost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            return;
        }

        if (mediaType !== "writing" && content.length > characterLimit) {
            toast.error(`Status posts are limited to ${characterLimit} characters. Upgrade to premium for 400 characters!`);
            return;
        }

        setIsLoading(true);
        const supabase = createClient();

        try {
            const {
                data: {user},
            } = await supabase.auth.getUser();
            if (!user) {
                throw new Error("Not authenticated");
            }

            const {error} = await supabase.from("posts").insert({
                author_id: user.id,
                content: content.trim(),
                media_type: "status",
                content_type: "text",
                content_rating: contentRating,
                is_promotional: isPromotional,
                visibility: visibility,
                comment_scope: commentScope,
                image_url: mediaUrl || null,
                media_url: mediaUrl || null,
                audio_url: selectedSoundtrack || null,
            });

            if (error) {
                console.error("[v0] Post creation error:", error);
                toast.error(`Failed to create post: ${error.message}`);
                throw error;
            }

            setContent("");
            setContentRating("sfw");
            setVisibility("everyone");
            setIsPromotional(false);
            setMediaUrl("");
            setUploadedFile(null);
            setUploadProgress(0);
            setSelectedSoundtrack(null);
            toast.success("Post created successfully!");
            onPostCreated();
        } catch (error) {
            console.error("[v0] Error creating post:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMediaPost = async () => {
        if (!mediaTitle.trim() || !mediaUrl.trim()) {
            return;
        }

        setIsLoading(true);
        const supabase = createClient();

        try {
            const {
                data: {user},
            } = await supabase.auth.getUser();
            if (!user) {
                throw new Error("Not authenticated");
            }

            const {data: mediaItem, error: mediaError} = await supabase
                .from("media_items")
                .insert({
                    user_id: user.id,
                    title: mediaTitle.trim(),
                    description: mediaDescription.trim(),
                    media_type: mediaType,
                    media_url: mediaUrl.trim(),
                    content_rating: contentRating,
                })
                .select()
                .single();

            if (mediaError) {
                console.error("[v0] Media item creation error:", mediaError);
                toast.error(`Failed to create media: ${mediaError.message}`);
                throw mediaError;
            }

            if (tags.length > 0 && mediaItem) {
                const tagInserts = tags.map((tag) => ({
                    media_item_id: mediaItem.id,
                    tag: tag.toLowerCase(),
                }));

                await supabase.from("media_tags").insert(tagInserts);
            }

            const {error: postError} = await supabase.from("posts").insert({
                author_id: user.id,
                content: `Shared a ${mediaType}: ${mediaTitle}`,
                media_type: mediaType,
                media_url: mediaUrl.trim(),
                image_url: mediaType === "picture" ? mediaUrl.trim() : null,
                content_rating: contentRating,
                visibility: visibility,
                comment_scope: commentScope,
                audio_url: mediaType === "picture" ? selectedSoundtrack : null,
            });

            if (postError) {
                console.error("[v0] Post creation error:", postError);
                toast.error(`Failed to create post: ${postError.message}`);
                throw postError;
            }

            setMediaTitle("");
            setMediaDescription("");
            setMediaUrl("");
            setTags([]);
            setTagInput("");
            setContentRating("sfw");
            setVisibility("everyone");
            setUploadedFile(null);
            setUploadProgress(0);
            setSelectedSoundtrack(null);
            setIsDialogOpen(false);
            toast.success("Media shared successfully!");
            onPostCreated();
        } catch (error) {
            console.error("[v0] Error creating media post:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const validateMediaFile = (file: File, type: string): boolean => {
        const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;
        const validExtensions: Record<string, string[]> = {
            picture: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"],
            video: [".mp4", ".mov", ".avi", ".wmv", ".webm", ".mkv"],
            audio: [".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"],
            gif: [".gif"],
        };

        return validExtensions[type]?.includes(fileExt) || false;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        const maxSizes = {
            picture: 10 * 1024 * 1024, // 10MB
            video: 500 * 1024 * 1024, // 500MB
            audio: 50 * 1024 * 1024, // 50MB
            gif: 10 * 1024 * 1024, // 10MB
        };

        const maxSize = maxSizes[mediaType as keyof typeof maxSizes] || 10 * 1024 * 1024;
        if (file.size > maxSize) {
            const sizeMB = (maxSize / (1024 * 1024)).toFixed(0);
            setFileError(`File size exceeds ${sizeMB}MB limit for ${mediaType}s`);
            toast.error(`File too large. Maximum size is ${sizeMB}MB for ${mediaType}s`);
            return;
        }

        if (!validateMediaFile(file, mediaType)) {
            const validExtensions: Record<string, string[]> = {
                picture: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"],
                video: [".mp4", ".mov", ".avi", ".wmv", ".webm", ".mkv"],
                audio: [".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"],
                gif: [".gif"],
            };
            setFileError(`Invalid file type. Please upload a ${mediaType} file (${validExtensions[mediaType]?.join(", ")})`);
            toast.error(`Invalid file type for ${mediaType}`);
            setTimeout(() => setFileError(null), 5000);
            return;
        }

        setFileError(null);
        setUploadedFile(file);
        setUploadProgress(0);

        if (mediaType === "picture" || mediaType === "video") {
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }

        const supabase = createClient();
        const {
            data: {user},
        } = await supabase.auth.getUser();
        if (!user) {
            toast.error("You must be logged in to upload files");
            return;
        }

        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const uploadInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(uploadInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 200);

            const {data, error} = await supabase.storage.from("media").upload(fileName, file, {
                cacheControl: "3600",
                upsert: false,
            });

            clearInterval(uploadInterval);

            if (error) {
                console.error("[v0] Upload error:", error);
                toast.error(`Upload failed: ${error.message}`);
                setUploadProgress(0);
                setUploadedFile(null);
                setPreviewUrl(null);
                return;
            }

            const {
                data: {publicUrl},
            } = supabase.storage.from("media").getPublicUrl(fileName);

            setMediaUrl(publicUrl);
            setUploadProgress(100);
            toast.success("File uploaded successfully!");
        } catch (error) {
            console.error("[v0] Upload error:", error);
            toast.error("Failed to upload file");
            setUploadProgress(0);
            setUploadedFile(null);
            setPreviewUrl(null);
        }
    };

    const handleDropZoneClick = () => {
        fileInputRef.current?.click();
    };

    const handleStatusDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleStatusDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleStatusDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) {
            return;
        }

        const imageFiles = files.filter((file) => file.type.startsWith("image/"));
        if (imageFiles.length === 0) {
            toast.error("Please drop image files only");
            return;
        }

        // If multiple images, open multi-image dialog
        if (imageFiles.length > 1) {
            setMultiImageDialogOpen(true);
            return;
        }

        // Single image - upload directly to status
        const file = imageFiles[0];
        await uploadStatusImage(file);
    };

    const uploadStatusImage = async (file: File) => {
        const supabase = createClient();
        const {
            data: {user},
        } = await supabase.auth.getUser();
        if (!user) {
            toast.error("You must be logged in to upload files");
            return;
        }

        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            setUploadProgress(10);

            const {data, error} = await supabase.storage.from("media").upload(fileName, file, {
                cacheControl: "3600",
                upsert: false,
            });

            if (error) {
                console.error("[v0] Upload error:", error);
                toast.error(`Upload failed: ${error.message}`);
                setUploadProgress(0);
                return;
            }

            const {
                data: {publicUrl},
            } = supabase.storage.from("media").getPublicUrl(fileName);

            setMediaUrl(publicUrl);
            setUploadProgress(100);
            toast.success("Image uploaded! Add it to your post.");
        } catch (error) {
            console.error("[v0] Upload error:", error);
            toast.error("Failed to upload image");
            setUploadProgress(0);
        }
    };

    const handleStatusFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) {
            return;
        }

        if (files.length > 1) {
            setMultiImageDialogOpen(true);
            return;
        }

        await uploadStatusImage(files[0]);
    };

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    return (
        <Card className="border-royal-purple/20 bg-gradient-to-br from-card to-card/50">
            <CardContent className="pt-6">
                <form onSubmit={handleStatusPost}>
                    <div className="flex gap-4">
                        <Avatar className="h-10 w-10 ring-2 ring-royal-auburn/30">
                            <AvatarImage src={userProfile.avatar_url || undefined}/>
                            <AvatarFallback className="bg-gradient-to-br from-royal-auburn to-royal-purple text-white">
                                {(userProfile.display_name || userProfile.username)[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                            <div
                                className={`relative transition-all ${isDragging ? "ring-2 ring-royal-purple rounded-lg" : ""}`}
                                onDragOver={handleStatusDragOver}
                                onDragLeave={handleStatusDragLeave}
                                onDrop={handleStatusDrop}
                            >
                                {isDragging && (
                                    <div
                                        className="absolute inset-0 bg-royal-purple/10 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center border-2 border-dashed border-royal-purple">
                                        <div className="text-center">
                                            <Upload className="h-12 w-12 mx-auto mb-2 text-royal-purple"/>
                                            <p className="text-sm font-medium text-royal-purple">Drop images here</p>
                                        </div>
                                    </div>
                                )}
                                <RichTextEditor
                                    value={content}
                                    onChange={setContent}
                                    placeholder="What's on your mind?"
                                    minHeight="100px"
                                    disabled={isLoading}
                                />
                                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                  <span className={isOverLimit ? "text-destructive font-semibold" : ""}>
                    {content.length}/{characterLimit}
                  </span>
                                    {!isPremium && content.length > 200 && (
                                        <span
                                            className="ml-2 text-royal-purple">(Upgrade for {characterLimit} chars)</span>
                                    )}
                                </div>
                            </div>

                            {mediaUrl && uploadProgress === 100 && (
                                <div className="relative rounded-lg overflow-hidden border border-royal-purple/20">
                                    <img src={mediaUrl || "/placeholder.svg"} alt="Preview"
                                         className="w-full h-48 object-cover"/>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        className="absolute top-2 right-2"
                                        onClick={() => {
                                            setMediaUrl("");
                                            setUploadProgress(0);
                                        }}
                                    >
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            )}

                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <input
                                        ref={statusFileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleStatusFileInputChange}
                                    />

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "text-muted-foreground hover:bg-royal-purple/10",
                                            isScopeDialogOpen && "text-royal-purple bg-royal-purple/10"
                                        )}
                                        onClick={() => setIsScopeDialogOpen(true)}
                                    >
                                        <Lock className="h-4 w-4 mr-2"/>
                                        {commentScope === "everyone" ? "Everyone" : commentScope === "friends" ? "Friends" : "Followers"} can
                                        comment
                                    </Button>

                                    <Dialog open={isScopeDialogOpen} onOpenChange={setIsScopeDialogOpen}>
                                        <DialogContent className="max-w-sm">
                                            <DialogHeader>
                                                <DialogTitle>Who can comment?</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-2 mt-4">
                                                <Button
                                                    variant={commentScope === "everyone" ? "default" : "outline"}
                                                    className="w-full justify-start"
                                                    onClick={() => {
                                                        setCommentScope("everyone");
                                                        setIsScopeDialogOpen(false);
                                                    }}
                                                >
                                                    <Globe className="h-4 w-4 mr-2"/>
                                                    Everyone
                                                </Button>
                                                <Button
                                                    variant={commentScope === "friends" ? "default" : "outline"}
                                                    className="w-full justify-start"
                                                    onClick={() => {
                                                        setCommentScope("friends");
                                                        setIsScopeDialogOpen(false);
                                                    }}
                                                >
                                                    <Users className="h-4 w-4 mr-2"/>
                                                    Friends Only
                                                </Button>
                                                <Button
                                                    variant={commentScope === "followers" ? "default" : "outline"}
                                                    className="w-full justify-start"
                                                    onClick={() => {
                                                        setCommentScope("followers");
                                                        setIsScopeDialogOpen(false);
                                                    }}
                                                >
                                                    <Megaphone className="h-4 w-4 mr-2"/>
                                                    Followers Only
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    <Dialog open={isPollDialogOpen} onOpenChange={setIsPollDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:text-royal-purple hover:bg-royal-purple/10"
                                            >
                                                <BarChart3 className="h-4 w-4 mr-2"/>
                                                Create Poll
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>Create a Poll</DialogTitle>
                                            </DialogHeader>
                                            <PollCreator
                                                onPollCreated={() => {
                                                    setIsPollDialogOpen(false);
                                                    onPostCreated();
                                                }}
                                            />
                                        </DialogContent>
                                    </Dialog>

                                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:text-royal-orange hover:bg-royal-orange/10"
                                                onClick={() => setIsDialogOpen(true)}
                                                aria-label="Add media"
                                            >
                                                <ImagePlus className="h-4 w-4 mr-2"/>
                                                Add Media
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle className="text-gradient">Share Media</DialogTitle>
                                            </DialogHeader>

                                            {fileError && (
                                                <div
                                                    className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                                                    <AlertTriangle
                                                        className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"/>
                                                    <p className="text-sm text-destructive">{fileError}</p>
                                                </div>
                                            )}

                                            <Tabs value={mediaType} onValueChange={(v) => setMediaType(v as any)}>
                                                <TabsList className="grid grid-cols-5 bg-background/50">
                                                    <TabsTrigger value="picture">
                                                        <ImageIcon className="h-4 w-4"/>
                                                    </TabsTrigger>
                                                    <TabsTrigger value="gif">GIF</TabsTrigger>
                                                    <TabsTrigger value="video">
                                                        <Video className="h-4 w-4"/>
                                                    </TabsTrigger>
                                                    <TabsTrigger value="audio">
                                                        <Music className="h-4 w-4"/>
                                                    </TabsTrigger>
                                                    <TabsTrigger value="writing">
                                                        <FileText className="h-4 w-4"/>
                                                    </TabsTrigger>
                                                </TabsList>

                                                <TabsContent value={mediaType} className="space-y-4 mt-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="title">Title *</Label>
                                                        <Input
                                                            id="title"
                                                            placeholder="Give your media a title"
                                                            value={mediaTitle}
                                                            onChange={(e) => setMediaTitle(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="description">Description</Label>
                                                        <RichTextEditor
                                                            value={mediaDescription}
                                                            onChange={setMediaDescription}
                                                            placeholder="Describe your media"
                                                            minHeight="80px"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label
                                                            htmlFor="file-upload">{mediaType === "writing" ? "Content" : "Upload File"}</Label>
                                                        {mediaType !== "writing" && (
                                                            <>
                                                                <div
                                                                    className="border-2 border-dashed border-royal-purple/30 rounded-lg p-6 hover:border-royal-purple/50 transition-colors cursor-pointer"
                                                                    onClick={handleDropZoneClick}
                                                                >
                                                                    {!uploadedFile ? (
                                                                        <div className="text-center">
                                                                            <Upload
                                                                                className="h-12 w-12 mx-auto mb-3 text-muted-foreground"/>
                                                                            <p className="text-sm text-muted-foreground mb-2">
                                                                                Click to upload or drag and drop
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {mediaType === "picture" && "JPG, PNG, GIF, WEBP (max 10MB)"}
                                                                                {mediaType === "video" && "MP4, MOV, AVI, WEBM (max 500MB)"}
                                                                                {mediaType === "audio" && "MP3, WAV, OGG, M4A (max 50MB)"}
                                                                                {mediaType === "gif" && "GIF (max 10MB)"}
                                                                            </p>
                                                                            <input
                                                                                ref={fileInputRef}
                                                                                id="file-upload"
                                                                                type="file"
                                                                                accept={
                                                                                    mediaType === "picture"
                                                                                        ? "image/*"
                                                                                        : mediaType === "video"
                                                                                            ? "video/*"
                                                                                            : mediaType === "audio"
                                                                                                ? "audio/*"
                                                                                                : "*/*"
                                                                                }
                                                                                onChange={handleFileUpload}
                                                                                className="hidden"
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-3">
                                                                            {mediaType === "picture" && previewUrl && (
                                                                                <div
                                                                                    className="relative w-full h-48 rounded-lg overflow-hidden bg-black/5">
                                                                                    <img
                                                                                        src={previewUrl || "/placeholder.svg"}
                                                                                        alt="Preview"
                                                                                        className="w-full h-full object-contain"
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                            {mediaType === "video" && previewUrl && (
                                                                                <div
                                                                                    className="relative w-full h-48 rounded-lg overflow-hidden bg-black/5">
                                                                                    <video src={previewUrl} controls
                                                                                           className="w-full h-full object-contain"/>
                                                                                </div>
                                                                            )}
                                                                            <div
                                                                                className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                                                                                    <p className="text-xs text-muted-foreground">
                                                                                        {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                                                                                    </p>
                                                                                </div>
                                                                                {uploadProgress === 100 ? (
                                                                                    <Badge variant="secondary"
                                                                                           className="bg-green-500/20 text-green-500">
                                                                                        Complete
                                                                                    </Badge>
                                                                                ) : (
                                                                                    <Badge
                                                                                        variant="secondary">{uploadProgress}%</Badge>
                                                                                )}
                                                                                <Button
                                                                                    type="button"
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    onClick={() => {
                                                                                        setUploadedFile(null);
                                                                                        setPreviewUrl(null);
                                                                                        setMediaUrl("");
                                                                                        setUploadProgress(0);
                                                                                    }}
                                                                                >
                                                                                    <X className="h-4 w-4"/>
                                                                                </Button>
                                                                            </div>
                                                                            {uploadProgress > 0 && uploadProgress < 100 && (
                                                                                <div
                                                                                    className="w-full bg-muted rounded-full h-2">
                                                                                    <div
                                                                                        className="bg-gradient-to-r from-royal-blue to-royal-purple h-2 rounded-full transition-all"
                                                                                        style={{width: `${uploadProgress}%`}}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    {mediaType === "writing" && (
                                                        <div className="space-y-2">
                                                            <Label htmlFor="url">Content *</Label>
                                                            <RichTextEditor
                                                                value={mediaUrl}
                                                                onChange={setMediaUrl}
                                                                placeholder="Write your content here..."
                                                                minHeight="150px"
                                                            />
                                                        </div>
                                                    )}

                                                    {mediaType === "picture" && mediaUrl && (
                                                        <div className="border rounded-lg p-4 bg-card/50">
                                                            <SoundtrackLibrary
                                                                selectedSoundtrack={selectedSoundtrack}
                                                                onSelectSoundtrack={setSelectedSoundtrack}
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="space-y-2">
                                                        <Label>Tags</Label>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                placeholder="Add tags..."
                                                                value={tagInput}
                                                                onChange={(e) => setTagInput(e.target.value)}
                                                                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                                                            />
                                                            <Button type="button" variant="outline" onClick={addTag}>
                                                                <Tag className="h-4 w-4"/>
                                                            </Button>
                                                        </div>
                                                        {tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {tags.map((tag) => (
                                                                    <Badge
                                                                        key={tag}
                                                                        variant="secondary"
                                                                        className="cursor-pointer"
                                                                        onClick={() => removeTag(tag)}
                                                                    >
                                                                        {tag} <X className="h-3 w-3 ml-1"/>
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="rating">Content Rating *</Label>
                                                        <Select value={contentRating}
                                                                onValueChange={(v) => setContentRating(v as any)}>
                                                            <SelectTrigger>
                                                                <SelectValue/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="sfw">🟢 SFW</SelectItem>
                                                                <SelectItem value="nsfw">🔴 NSFW</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <Button
                                                        onClick={handleMediaPost}
                                                        disabled={!mediaTitle.trim() || !mediaUrl.trim() || isLoading}
                                                        className="w-full bg-gradient-to-r from-royal-auburn to-royal-purple hover:from-royal-auburn-dark hover:to-royal-purple-dark"
                                                    >
                                                        {isLoading ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                                                                Sharing...
                                                            </>
                                                        ) : (
                                                            `Share ${mediaType}`
                                                        )}
                                                    </Button>
                                                </TabsContent>
                                            </Tabs>
                                        </DialogContent>
                                    </Dialog>

                                    <Select value={visibility} onValueChange={(v) => setVisibility(v as any)}>
                                        <SelectTrigger className="w-[140px] h-9">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="everyone">
                                                <div className="flex items-center gap-2">
                                                    <Globe className="h-3 w-3"/>
                                                    Everyone
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="friends_only">
                                                <div className="flex items-center gap-2">
                                                    <Lock className="h-3 w-3"/>
                                                    Friends Only
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={contentRating} onValueChange={(v) => setContentRating(v as any)}>
                                        <SelectTrigger className="w-[120px] h-9">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sfw">🟢 SFW</SelectItem>
                                            <SelectItem value="nsfw">🔴 NSFW</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <div
                                        className="flex items-center space-x-2 px-2 py-1 border rounded-md hover:bg-accent">
                                        <Checkbox
                                            id="promotional"
                                            checked={isPromotional}
                                            onCheckedChange={(checked) => setIsPromotional(checked as boolean)}
                                        />
                                        <Label htmlFor="promotional"
                                               className="flex items-center gap-1 cursor-pointer text-sm">
                                            <Megaphone className="h-3 w-3 text-amber-500"/>
                                            Promotional
                                        </Label>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={!content.trim() || isLoading || isOverLimit}
                                    className="bg-gradient-to-r from-royal-auburn to-royal-purple hover:from-royal-auburn-dark hover:to-royal-purple-dark shadow-md shadow-royal-purple/20"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                                            Posting...
                                        </>
                                    ) : (
                                        "Post"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>

                <MultiImageUploadDialog
                    open={multiImageDialogOpen}
                    onOpenChange={setMultiImageDialogOpen}
                    onPostCreated={onPostCreated}
                />
            </CardContent>
        </Card>
    );
}
