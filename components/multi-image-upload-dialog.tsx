"use client";

import {AlertTriangle, ImagePlus, Loader2, Megaphone, Tag, X} from "lucide-react";
import type React from "react";
import {useCallback, useRef, useState} from "react";
import {toast} from "sonner";

import {RichTextEditor} from "@/components/rich-text-editor";
import {SoundtrackLibrary} from "@/components/soundtrack-library";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {createClient} from "@/lib/supabase/client";
import {cn} from "@/lib/utils";

interface MultiImageUploadDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onPostCreated: () => void
}

export function MultiImageUploadDialog({open, onOpenChange, onPostCreated}: MultiImageUploadDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [contentRating, setContentRating] = useState<"sfw" | "nsfw">("sfw");
    const [isPromotional, setIsPromotional] = useState(false);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [selectedSoundtrack, setSelectedSoundtrack] = useState<string | null>(null);
    const [uploadedImages, setUploadedImages] = useState<{ file: File; url: string; size: string }[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateImageFile = (file: File): boolean => {
        const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
        const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;
        return validExtensions.includes(fileExt);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) {
            return bytes + " B";
        }
        if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(1) + " KB";
        }
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) {
            return;
        }

        const validFiles: File[] = [];
        const invalidFiles: string[] = [];

        Array.from(files).forEach((file) => {
            if (validateImageFile(file)) {
                validFiles.push(file);
            } else {
                invalidFiles.push(file.name);
            }
        });

        if (invalidFiles.length > 0) {
            setFileError(
                `Invalid file type(s): ${invalidFiles.join(", ")}. Please upload images (.jpg, .jpeg, .png, .gif, .webp, .bmp)`,
            );
            setTimeout(() => setFileError(null), 5000);
        }

        if (validFiles.length === 0) {
            return;
        }

        setIsUploading(true);
        const supabase = createClient();
        const {
            data: {user},
        } = await supabase.auth.getUser();

        if (!user) {
            toast.error("You must be logged in to upload files");
            setIsUploading(false);
            return;
        }

        try {
            const uploadPromises = validFiles.map(async (file) => {
                const fileExt = file.name.split(".").pop();
                const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                const {data, error} = await supabase.storage.from("media").upload(fileName, file, {
                    cacheControl: "3600",
                    upsert: false,
                });

                if (error) {
                    throw error;
                }

                const {
                    data: {publicUrl},
                } = supabase.storage.from("media").getPublicUrl(fileName);

                return {
                    file,
                    url: publicUrl,
                    size: formatFileSize(file.size),
                };
            });

            const results = await Promise.all(uploadPromises);
            setUploadedImages((prev) => [...prev, ...results]);
            toast.success(`${results.length} image(s) uploaded successfully!`);
        } catch (error) {
            console.error("[v0] Upload error:", error);
            toast.error("Failed to upload some images");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileUpload(e.dataTransfer.files);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const removeImage = (index: number) => {
        setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    };

    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput("");
        }
    };

    const removeTag = (tag: string) => {
        setTags(tags.filter((t) => t !== tag));
    };

    const handlePost = async () => {
        if (uploadedImages.length === 0 || !title.trim()) {
            toast.error("Please add at least one image and a title");
            return;
        }

        setIsPosting(true);
        const supabase = createClient();

        try {
            const {
                data: {user},
            } = await supabase.auth.getUser();
            if (!user) {
                throw new Error("Not authenticated");
            }

            const imageUrls = uploadedImages.map((img) => img.url);

            const {error: postError} = await supabase.from("posts").insert({
                author_id: user.id,
                content: description.trim() || title.trim(),
                media_type: "picture",
                images: imageUrls,
                image_url: imageUrls[0],
                content_rating: contentRating,
                is_promotional: isPromotional,
                audio_url: selectedSoundtrack,
            });

            if (postError) {
                throw postError;
            }

            // Reset form
            setTitle("");
            setDescription("");
            setUploadedImages([]);
            setTags([]);
            setTagInput("");
            setContentRating("sfw");
            setIsPromotional(false);
            setSelectedSoundtrack(null);
            onOpenChange(false);
            toast.success("Post created successfully!");
            onPostCreated();
        } catch (error) {
            console.error("[v0] Error creating post:", error);
            toast.error("Failed to create post");
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-gradient">Share Images</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {fileError && (
                        <div
                            className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"/>
                            <p className="text-sm text-destructive">{fileError}</p>
                        </div>
                    )}

                    {/* Drag and Drop Zone */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={cn(
                            "border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer",
                            isDragging ? "border-royal-purple bg-royal-purple/5" : "border-border hover:border-royal-purple/50",
                            uploadedImages.length > 0 && "p-8",
                        )}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleFileUpload(e.target.files)}
                            className="hidden"
                        />
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-royal-purple/10 flex items-center justify-center">
                                {isUploading ? (
                                    <Loader2 className="h-8 w-8 text-royal-purple animate-spin"/>
                                ) : (
                                    <ImagePlus className="h-8 w-8 text-royal-purple"/>
                                )}
                            </div>
                            <div>
                                <p className="text-lg font-medium">
                                    {isUploading ? "Uploading..." : "Drop images here or click to browse"}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Supports: JPG, PNG, GIF, WebP, BMP • Multiple images allowed
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Image Previews */}
                    {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-4 gap-3">
                            {uploadedImages.map((image, index) => (
                                <div key={index} className="relative group aspect-square">
                                    <img
                                        src={image.url || "/placeholder.svg"}
                                        alt={`Upload ${index + 1}`}
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeImage(index)}
                                    >
                                        <X className="h-3 w-3"/>
                                    </Button>
                                    <div
                                        className="absolute bottom-1 left-1 bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs">
                                        {index + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            placeholder="Give your post a title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <RichTextEditor
                            value={description}
                            onChange={setDescription}
                            placeholder="Describe your images..."
                            minHeight="100px"
                        />
                    </div>

                    {/* Soundtrack Selection */}
                    {uploadedImages.length > 0 && (
                        <div className="border rounded-lg p-4 bg-card/50">
                            <SoundtrackLibrary selectedSoundtrack={selectedSoundtrack}
                                               onSelectSoundtrack={setSelectedSoundtrack}/>
                        </div>
                    )}

                    {/* Tags */}
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
                                    <Badge key={tag} variant="secondary" className="cursor-pointer"
                                           onClick={() => removeTag(tag)}>
                                        {tag} <X className="h-3 w-3 ml-1"/>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Options */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="space-y-2">
                            <Label htmlFor="rating">Content Rating *</Label>
                            <Select value={contentRating} onValueChange={(v) => setContentRating(v as any)}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sfw">🟢 SFW</SelectItem>
                                    <SelectItem value="nsfw">🔴 NSFW</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2 px-3 py-2 border rounded-md hover:bg-accent">
                            <Checkbox
                                id="promotional"
                                checked={isPromotional}
                                onCheckedChange={(checked) => setIsPromotional(checked as boolean)}
                            />
                            <Label htmlFor="promotional" className="flex items-center gap-1 cursor-pointer">
                                <Megaphone className="h-4 w-4 text-amber-500"/>
                                Promotional
                            </Label>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={handlePost}
                        disabled={uploadedImages.length === 0 || !title.trim() || isPosting}
                        className="w-full bg-gradient-to-r from-royal-auburn to-royal-purple hover:from-royal-auburn-dark hover:to-royal-purple-dark"
                    >
                        {isPosting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                                Posting...
                            </>
                        ) : (
                            `Post ${uploadedImages.length} Image${uploadedImages.length !== 1 ? "s" : ""}`
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
