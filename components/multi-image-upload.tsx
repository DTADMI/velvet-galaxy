"use client";

import {FolderPlus, Loader2, Upload, X} from "lucide-react";
import type React from "react";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {createClient} from "@/lib/supabase/client";

interface MultiImageUploadProps {
    onComplete: () => void
}

export function MultiImageUpload({onComplete}: MultiImageUploadProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [contentRating, setContentRating] = useState<"sfw" | "nsfw">("sfw");
    const [tags, setTags] = useState("");
    const [albumId, setAlbumId] = useState<string>("");
    const [albums, setAlbums] = useState<Array<{ id: string; name: string }>>([]);
    const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
    const [newAlbumName, setNewAlbumName] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        setFiles((prev) => [...prev, ...selectedFiles]);
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const createAlbum = async () => {
        if (!newAlbumName.trim()) {
            return;
        }

        const supabase = createClient();
        const {
            data: {user},
        } = await supabase.auth.getUser();
        if (!user) {
            return;
        }

        const {data, error} = await supabase
            .from("media_albums")
            .insert({
                user_id: user.id,
                name: newAlbumName.trim(),
                description: "",
            })
            .select()
            .single();

        if (!error && data) {
            setAlbums((prev) => [...prev, {id: data.id, name: data.name}]);
            setAlbumId(data.id);
            setNewAlbumName("");
            setIsCreatingAlbum(false);
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            return;
        }

        setIsUploading(true);
        const supabase = createClient();
        const {
            data: {user},
        } = await supabase.auth.getUser();
        if (!user) {
            return;
        }

        try {
            const totalFiles = files.length;
            let uploadedCount = 0;

            for (const file of files) {
                const fileExt = file.name.split(".").pop();
                const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                const {
                    data: uploadData,
                    error: uploadError
                } = await supabase.storage.from("media").upload(fileName, file);

                if (uploadError) {
                    throw uploadError;
                }

                const {
                    data: {publicUrl},
                } = supabase.storage.from("media").getPublicUrl(fileName);

                await supabase.from("media_items").insert({
                    user_id: user.id,
                    title: title || file.name,
                    description: description,
                    media_type: "picture",
                    media_url: publicUrl,
                    content_rating: contentRating,
                    album_id: albumId || null,
                });

                uploadedCount++;
                setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
            }

            if (tags.trim()) {
                const tagArray = tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter((t) => t);
                // Tags would be added here
            }

            onComplete();
        } catch (error) {
            console.error("Upload error:", error);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <Label htmlFor="files">Select Images (Multiple)</Label>
                    <Input
                        id="files"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="mt-2"
                        disabled={isUploading}
                    />
                </div>

                {files.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                        {files.map((file, index) => (
                            <Card key={index} className="relative p-2">
                                <img
                                    src={URL.createObjectURL(file) || "/placeholder.svg"}
                                    alt={file.name}
                                    className="w-full h-32 object-cover rounded"
                                />
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6"
                                    onClick={() => removeFile(index)}
                                    disabled={isUploading}
                                >
                                    <X className="h-4 w-4"/>
                                </Button>
                                <p className="text-xs mt-1 truncate">{file.name}</p>
                            </Card>
                        ))}
                    </div>
                )}

                <div>
                    <Label htmlFor="title">Title (Optional)</Label>
                    <Input
                        id="title"
                        placeholder="Give your images a title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isUploading}
                    />
                </div>

                <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                        id="description"
                        placeholder="Describe your images"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isUploading}
                    />
                </div>

                <div>
                    <Label htmlFor="album">Album (Optional)</Label>
                    <div className="flex gap-2">
                        <Select value={albumId} onValueChange={setAlbumId} disabled={isUploading}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select an album"/>
                            </SelectTrigger>
                            <SelectContent>
                                {albums.map((album) => (
                                    <SelectItem key={album.id} value={album.id}>
                                        {album.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Dialog open={isCreatingAlbum} onOpenChange={setIsCreatingAlbum}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon" disabled={isUploading}>
                                    <FolderPlus className="h-4 w-4"/>
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Album</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="album-name">Album Name</Label>
                                        <Input
                                            id="album-name"
                                            placeholder="My Album"
                                            value={newAlbumName}
                                            onChange={(e) => setNewAlbumName(e.target.value)}
                                        />
                                    </div>
                                    <Button onClick={createAlbum} className="w-full">
                                        Create Album
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                        id="tags"
                        placeholder="e.g., art, photography, nature"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        disabled={isUploading}
                    />
                </div>

                <div>
                    <Label htmlFor="rating">Content Rating</Label>
                    <Select value={contentRating} onValueChange={(v) => setContentRating(v as any)}
                            disabled={isUploading}>
                        <SelectTrigger>
                            <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sfw">🟢 SFW (Safe for Work)</SelectItem>
                            <SelectItem value="nsfw">🔴 NSFW (Not Safe for Work)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {isUploading && (
                    <div className="space-y-2">
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-red-900 to-purple-900 h-2 rounded-full transition-all"
                                style={{width: `${uploadProgress}%`}}
                            />
                        </div>
                        <p className="text-sm text-center text-muted-foreground">Uploading... {uploadProgress}%</p>
                    </div>
                )}

                <Button
                    onClick={handleUpload}
                    disabled={files.length === 0 || isUploading}
                    className="w-full bg-gradient-to-r from-red-900 to-purple-900 hover:from-red-800 hover:to-purple-800"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                            Uploading {files.length} image{files.length > 1 ? "s" : ""}...
                        </>
                    ) : (
                        <>
                            <Upload className="h-4 w-4 mr-2"/>
                            Upload {files.length} image{files.length > 1 ? "s" : ""}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
