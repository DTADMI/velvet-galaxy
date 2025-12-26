"use client";

import {AlertTriangle, Camera, FileText, ImageIcon, Loader2, Music, Tag, Upload, Video, X} from "lucide-react";
import {useRouter} from "next/navigation";
import type React from "react";
import {useEffect, useRef, useState} from "react";

import {LiveMediaCapture} from "@/components/live-media-capture";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Checkbox} from "@/components/ui/checkbox";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Textarea} from "@/components/ui/textarea";
import {createClient} from "@/lib/supabase/client";
import {useTags} from "@/hooks/use-tags";

interface UploadFormProps {
    profile: {
        id: string
        username: string
        display_name: string | null
        avatar_url: string | null
    }
    initialType: string
}

export function UploadForm({profile, initialType}: UploadFormProps) {
    const [uploadType, setUploadType] = useState(initialType);
    const [isUploading, setIsUploading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const [taggedPeople, setTaggedPeople] = useState<string[]>([]);
    const {tags, tagInput, setTags, setTagInput, addTag, removeTag} = useTags();
    const [albums, setAlbums] = useState<any[]>([]);
    const [albumInput, setAlbumInput] = useState("");
    const [showAlbumSuggestions, setShowAlbumSuggestions] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        content: "",
        contentRating: "sfw",
        album: "",
        consentWarning: false,
        ageWarning: false,
        useAsProfilePicture: false,
    });
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showLiveCapture, setShowLiveCapture] = useState(false);

    useEffect(() => {
        fetchAlbums();
    }, [uploadType]);

    const fetchAlbums = async () => {
        const supabase = createClient();
        const {data} = await supabase
            .from("media_albums")
            .select("*")
            .eq("user_id", profile.id)
            .eq("media_type", uploadType)
            .order("created_at", {ascending: false});

        if (data) {
            setAlbums(data);
        }
    };

    const getAcceptedExtensions = (type: string): string[] => {
        switch (type) {
            case "picture":
                return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"];
            case "video":
                return [".mp4", ".mov", ".avi", ".wmv", ".flv", ".webm", ".mkv"];
            case "audio":
                return [".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"];
            default:
                return [];
        }
    };

    const validateFiles = (filesToValidate: File[]): { valid: File[]; invalid: File[] } => {
        const acceptedExtensions = getAcceptedExtensions(uploadType);
        const valid: File[] = [];
        const invalid: File[] = [];

        filesToValidate.forEach((file) => {
            const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;
            if (acceptedExtensions.includes(fileExt)) {
                valid.push(file);
            } else {
                invalid.push(file);
            }
        });

        return {valid, invalid};
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length > 0) {
            const {valid, invalid} = validateFiles(selectedFiles);

            if (invalid.length > 0) {
                const acceptedExtensions = getAcceptedExtensions(uploadType);
                setFileError(
                    `${invalid.length} file(s) rejected. Only ${acceptedExtensions.join(", ")} files are accepted for ${uploadType}s.`,
                );
                setTimeout(() => setFileError(null), 5000);
            }

            if (valid.length > 0) {
                setFiles(valid);
                if (uploadType === "picture" || uploadType === "video") {
                    const urls = valid.map((file) => URL.createObjectURL(file));
                    setPreviewUrls(urls);
                }
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) {
            const {valid, invalid} = validateFiles(droppedFiles);

            if (invalid.length > 0) {
                const acceptedExtensions = getAcceptedExtensions(uploadType);
                setFileError(
                    `${invalid.length} file(s) rejected. Only ${acceptedExtensions.join(", ")} files are accepted for ${uploadType}s.`,
                );
                setTimeout(() => setFileError(null), 5000);
            }

            if (valid.length > 0) {
                setFiles(valid);
                if (uploadType === "picture" || uploadType === "video") {
                    const urls = valid.map((file) => URL.createObjectURL(file));
                    setPreviewUrls(urls);
                }
            }
        }
    };

    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        const newUrls = previewUrls.filter((_, i) => i !== index);
        setFiles(newFiles);
        setPreviewUrls(newUrls);
    };

    const handleAlbumSelect = (albumTitle: string) => {
        setFormData({...formData, album: albumTitle});
        setAlbumInput(albumTitle);
        setShowAlbumSuggestions(false);
    };

    const filteredAlbums = albums.filter((album) => album.title.toLowerCase().includes(albumInput.toLowerCase()));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0 && uploadType !== "writing") {
            alert("Please select at least one file to upload");
            return;
        }

        if (!formData.consentWarning) {
            alert("Please confirm that all people in this content have given consent");
            return;
        }

        if (!formData.ageWarning) {
            alert("Please confirm that all people in this content are 18 or older");
            return;
        }

        setIsUploading(true);
        const supabase = createClient();

        try {
            let albumId = null;
            if (formData.album) {
                const existingAlbum = albums.find((a) => a.title === formData.album);
                if (existingAlbum) {
                    albumId = existingAlbum.id;
                } else {
                    const {data: newAlbum, error: albumError} = await supabase
                        .from("media_albums")
                        .insert({
                            user_id: profile.id,
                            media_type: uploadType,
                            title: formData.album,
                            description: "",
                        })
                        .select()
                        .single();

                    if (albumError) {
                        console.error("[v0] Album creation error:", albumError);
                        throw albumError;
                    }
                    albumId = newAlbum.id;
                }
            }

            const uploadedMediaIds: string[] = [];

            for (const file of files) {
                let mediaUrl = null;

                const fileExt = file.name.split(".").pop();
                const fileName = `${profile.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${uploadType}s/${fileName}`;

                const {error: uploadError} = await supabase.storage.from("media").upload(filePath, file);

                if (uploadError) {
                    console.error("[v0] Storage upload error:", uploadError);
                    throw uploadError;
                }

                const {
                    data: {publicUrl},
                } = supabase.storage.from("media").getPublicUrl(filePath);
                mediaUrl = publicUrl;

                const {data: mediaItem, error: insertError} = await supabase
                    .from("media_items")
                    .insert({
                        user_id: profile.id,
                        media_type: uploadType,
                        title: formData.title,
                        description: formData.description,
                        content: uploadType === "writing" ? formData.content : null,
                        media_url: mediaUrl,
                        thumbnail_url: uploadType === "video" ? mediaUrl : null,
                        content_rating: formData.contentRating,
                        album_id: albumId,
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error("[v0] Media insert error:", insertError);
                    throw insertError;
                }

                uploadedMediaIds.push(mediaItem.id);

                if (formData.useAsProfilePicture && uploadType === "picture" && files.length === 1 && mediaUrl) {
                    await supabase.from("profiles").update({avatar_url: mediaUrl}).eq("id", profile.id);
                }

                await supabase.from("posts").insert({
                    author_id: profile.id,
                    content: formData.description || `Uploaded a new ${uploadType}: ${formData.title}`,
                    media_type: uploadType,
                    media_url: mediaUrl,
                    image_url: uploadType === "picture" ? mediaUrl : null,
                    content_rating: formData.contentRating,
                    visibility: "everyone",
                });
            }

            if (tags.length > 0) {
                const tagInserts = uploadedMediaIds.flatMap((mediaId) =>
                    tags.map((tag) => ({
                        media_item_id: mediaId,
                        tag: tag,
                    })),
                );
                await supabase.from("media_tags").insert(tagInserts);
            }

            alert("Upload successful!");
            router.push("/feed");
        } catch (error) {
            console.error("[v0] Upload error:", error);
            alert(`Failed to upload. Please try again. Error: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDropZoneClick = () => {
        fileInputRef.current?.click();
    };

    const handleLiveCapture = (file: File) => {
        setFiles([file]);
        if (uploadType === "picture" || uploadType === "video") {
            const url = URL.createObjectURL(file);
            setPreviewUrls([url]);
        }
        setShowLiveCapture(false);
    };

    return (
        <Card className="border-royal-purple/20">
            <CardHeader>
                <CardTitle className="text-2xl text-gradient">Upload Media</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs value={uploadType} onValueChange={setUploadType}>
                    <TabsList className="grid grid-cols-4 mb-6">
                        <TabsTrigger value="picture">
                            <ImageIcon className="h-4 w-4 mr-2"/>
                            Picture
                        </TabsTrigger>
                        <TabsTrigger value="video">
                            <Video className="h-4 w-4 mr-2"/>
                            Video
                        </TabsTrigger>
                        <TabsTrigger value="audio">
                            <Music className="h-4 w-4 mr-2"/>
                            Audio
                        </TabsTrigger>
                        <TabsTrigger value="writing">
                            <FileText className="h-4 w-4 mr-2"/>
                            Writing
                        </TabsTrigger>
                    </TabsList>

                    {fileError && (
                        <div
                            className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"/>
                            <p className="text-sm text-destructive">{fileError}</p>
                        </div>
                    )}

                    {showLiveCapture ? (
                        <LiveMediaCapture
                            type={uploadType as "picture" | "video" | "audio"}
                            onCapture={handleLiveCapture}
                            onCancel={() => setShowLiveCapture(false)}
                        />
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <TabsContent value="picture" className="space-y-4">
                                <div className="flex gap-2 mb-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 bg-transparent"
                                        onClick={() => setShowLiveCapture(true)}
                                    >
                                        <Camera className="h-4 w-4 mr-2"/>
                                        Take Photo
                                    </Button>
                                    <div
                                        className="flex-1 text-center text-sm text-muted-foreground flex items-center justify-center">
                                        or
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 bg-transparent"
                                        onClick={handleDropZoneClick}
                                    >
                                        <Upload className="h-4 w-4 mr-2"/>
                                        Upload File
                                    </Button>
                                </div>

                                <div
                                    className={`border-2 border-dashed rounded-lg p-16 text-center transition-colors cursor-pointer ${
                                        isDragging
                                            ? "border-royal-purple bg-royal-purple/10"
                                            : "border-royal-purple/20 hover:border-royal-purple/40"
                                    }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={handleDropZoneClick}
                                >
                                    <Upload className="h-16 w-16 mx-auto mb-6 text-muted-foreground"/>
                                    <p className="text-lg text-muted-foreground mb-4">Drag and drop pictures here, or
                                        click to browse</p>
                                    <p className="text-sm text-muted-foreground mt-3">
                                        Accepted: {getAcceptedExtensions("picture").join(", ")}
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>

                                {previewUrls.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">{previewUrls.length} image(s) selected</p>
                                        <div className="grid grid-cols-4 gap-3">
                                            {previewUrls.map((url, index) => (
                                                <div
                                                    key={index}
                                                    className="relative rounded-lg overflow-hidden border border-royal-purple/20 aspect-square"
                                                >
                                                    <img
                                                        src={url || "/placeholder.svg"}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute top-1 right-1 h-7 w-7"
                                                        onClick={() => removeFile(index)}
                                                    >
                                                        <X className="h-4 w-4"/>
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="video" className="space-y-4">
                                <div className="flex gap-2 mb-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 bg-transparent"
                                        onClick={() => setShowLiveCapture(true)}
                                    >
                                        <Video className="h-4 w-4 mr-2"/>
                                        Record Video
                                    </Button>
                                    <div
                                        className="flex-1 text-center text-sm text-muted-foreground flex items-center justify-center">
                                        or
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 bg-transparent"
                                        onClick={handleDropZoneClick}
                                    >
                                        <Upload className="h-4 w-4 mr-2"/>
                                        Upload File
                                    </Button>
                                </div>

                                <div
                                    className={`border-2 border-dashed rounded-lg p-16 text-center transition-colors cursor-pointer ${
                                        isDragging
                                            ? "border-royal-purple bg-royal-purple/10"
                                            : "border-royal-purple/20 hover:border-royal-purple/40"
                                    }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={handleDropZoneClick}
                                >
                                    <Upload className="h-16 w-16 mx-auto mb-6 text-muted-foreground"/>
                                    <p className="text-lg text-muted-foreground mb-4">Drag and drop videos here, or
                                        click to browse</p>
                                    <p className="text-sm text-muted-foreground mt-3">
                                        Accepted: {getAcceptedExtensions("video").join(", ")}
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="video/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                {files.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">{files.length} file(s) selected</p>
                                        {files.map((file, index) => (
                                            <div key={index}
                                                 className="flex items-center justify-between p-3 border rounded-lg bg-card">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <Video className="h-5 w-5 text-royal-orange flex-shrink-0"/>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                                        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                </div>
                                                <Button type="button" variant="ghost" size="sm"
                                                        onClick={() => removeFile(index)}>
                                                    <X className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="audio" className="space-y-4">
                                <div className="flex gap-2 mb-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 bg-transparent"
                                        onClick={() => setShowLiveCapture(true)}
                                    >
                                        <Music className="h-4 w-4 mr-2"/>
                                        Record Audio
                                    </Button>
                                    <div
                                        className="flex-1 text-center text-sm text-muted-foreground flex items-center justify-center">
                                        or
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 bg-transparent"
                                        onClick={handleDropZoneClick}
                                    >
                                        <Upload className="h-4 w-4 mr-2"/>
                                        Upload File
                                    </Button>
                                </div>

                                <div
                                    className={`border-2 border-dashed rounded-lg p-16 text-center transition-colors cursor-pointer ${
                                        isDragging
                                            ? "border-royal-purple bg-royal-purple/10"
                                            : "border-royal-purple/20 hover:border-royal-purple/40"
                                    }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={handleDropZoneClick}
                                >
                                    <Upload className="h-16 w-16 mx-auto mb-6 text-muted-foreground"/>
                                    <p className="text-lg text-muted-foreground mb-4">
                                        Drag and drop audio files here, or click to browse
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-3">
                                        Accepted: {getAcceptedExtensions("audio").join(", ")}
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="audio/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                {files.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">{files.length} file(s) selected</p>
                                        {files.map((file, index) => (
                                            <div key={index}
                                                 className="flex items-center justify-between p-3 border rounded-lg bg-card">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <Music className="h-5 w-5 text-royal-blue flex-shrink-0"/>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                                        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                </div>
                                                <Button type="button" variant="ghost" size="sm"
                                                        onClick={() => removeFile(index)}>
                                                    <X className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="writing" className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="writing-content">Content</Label>
                                    <Textarea
                                        id="writing-content"
                                        placeholder="Write your content here..."
                                        value={formData.content}
                                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                                        className="min-h-[300px]"
                                        required
                                    />
                                </div>
                            </TabsContent>

                            <div className="space-y-4 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        placeholder="Give your upload a title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe your upload..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="min-h-[100px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="content-rating">Content Rating *</Label>
                                    <Select
                                        value={formData.contentRating}
                                        onValueChange={(value) => setFormData({...formData, contentRating: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sfw">Safe for Work (SFW)</SelectItem>
                                            <SelectItem value="nsfw">Not Safe for Work (NSFW)</SelectItem>
                                            <SelectItem value="explicit">Explicit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2 relative">
                                    <Label htmlFor="album">Album (Optional)</Label>
                                    <Input
                                        id="album"
                                        placeholder="Add to an album or create new"
                                        value={albumInput}
                                        onChange={(e) => {
                                            setAlbumInput(e.target.value);
                                            setFormData({...formData, album: e.target.value});
                                            setShowAlbumSuggestions(true);
                                        }}
                                        onFocus={() => setShowAlbumSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowAlbumSuggestions(false), 200)}
                                    />
                                    {showAlbumSuggestions && filteredAlbums.length > 0 && (
                                        <div
                                            className="absolute z-10 w-full mt-1 bg-card border border-royal-purple/20 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                            {filteredAlbums.map((album) => (
                                                <button
                                                    key={album.id}
                                                    type="button"
                                                    className="w-full text-left px-4 py-2 hover:bg-royal-purple/10 transition-colors"
                                                    onClick={() => handleAlbumSelect(album.title)}
                                                >
                                                    {album.title}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

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
                                                    {tag} ×
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 pt-4 border-t">
                                    <div className="flex items-start gap-2">
                                        <Checkbox
                                            id="consent"
                                            checked={formData.consentWarning}
                                            onCheckedChange={(checked) => setFormData({
                                                ...formData,
                                                consentWarning: checked as boolean
                                            })}
                                        />
                                        <Label htmlFor="consent" className="text-sm cursor-pointer">
                                            <AlertTriangle className="h-4 w-4 inline mr-1 text-amber-500"/>I confirm
                                            that all people in this
                                            content have given their consent to be featured
                                        </Label>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <Checkbox
                                            id="age"
                                            checked={formData.ageWarning}
                                            onCheckedChange={(checked) => setFormData({
                                                ...formData,
                                                ageWarning: checked as boolean
                                            })}
                                        />
                                        <Label htmlFor="age" className="text-sm cursor-pointer">
                                            <AlertTriangle className="h-4 w-4 inline mr-1 text-amber-500"/>I confirm
                                            that all people in this
                                            content are 18 years or older
                                        </Label>
                                    </div>

                                    {uploadType === "picture" && files.length === 1 && (
                                        <div className="flex items-start gap-2">
                                            <Checkbox
                                                id="profile-pic"
                                                checked={formData.useAsProfilePicture}
                                                onCheckedChange={(checked) =>
                                                    setFormData({...formData, useAsProfilePicture: checked as boolean})
                                                }
                                            />
                                            <Label htmlFor="profile-pic" className="text-sm cursor-pointer">
                                                <Camera className="h-4 w-4 inline mr-1 text-royal-purple"/>
                                                Use this picture as my profile picture
                                            </Label>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isUploading}
                                    className="w-full bg-gradient-to-r from-royal-auburn to-royal-orange"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4 mr-2"/>
                                            Upload {files.length > 1 ? `${files.length} Files` : ""}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </Tabs>
            </CardContent>
        </Card>
    );
}
