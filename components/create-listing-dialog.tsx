"use client";

import {ImageIcon, Loader2, Music, Plus, Video, X} from "lucide-react";
import type React from "react";
import {useState} from "react";

import {LocationAutocomplete} from "@/components/location-autocomplete";
import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {createClient} from "@/lib/supabase/client";
import {useFeatureFlag} from "@/hooks/use-feature-flag";
import {toast} from "sonner";

interface CreateListingDialogProps {
    onListingCreated: () => void
}

export function CreateListingDialog({onListingCreated}: CreateListingDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const {isEnabled: isVideoEnabled} = useFeatureFlag("marketplace_video");
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        location: "",
        latitude: null as number | null,
        longitude: null as number | null,
    });
    const [images, setImages] = useState<File[]>([]);
    const [videos, setVideos] = useState<File[]>([]);
    const [audio, setAudio] = useState<File | null>(null);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setImages((prev) => [...prev, ...files]);

        // Create previews
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews((prev) => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isVideoEnabled) {
            toast.error("Video listings are currently disabled.");
            return;
        }
        const files = Array.from(e.target.files || []);
        setVideos((prev) => [...prev, ...files]);
    };

    const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAudio(file);
        }
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const removeVideo = (index: number) => {
        setVideos((prev) => prev.filter((_, i) => i !== index));
    };

    const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
        const supabase = createClient();
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const {error} = await supabase.storage.from(bucket).upload(filePath, file);

        if (error) {
            console.error("Upload error:", error);
            return null;
        }

        const {data} = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const supabase = createClient();

        try {
            const {
                data: {user},
            } = await supabase.auth.getUser();
            if (!user) {
                throw new Error("Not authenticated");
            }

            // Upload images
            const imageUrls = await Promise.all(images.map((img) => uploadFile(img, "media")));
            const validImageUrls = imageUrls.filter((url): url is string => url !== null);

            // Upload videos
            const videoUrls = await Promise.all(videos.map((vid) => uploadFile(vid, "media")));
            const validVideoUrls = videoUrls.filter((url): url is string => url !== null);

            // Upload audio
            let audioUrl = null;
            if (audio) {
                audioUrl = await uploadFile(audio, "media");
            }

            const {error} = await supabase.from("marketplace_items").insert({
                seller_id: user.id,
                title: formData.title,
                description: formData.description,
                price: Number.parseFloat(formData.price),
                location: formData.location,
                latitude: formData.latitude,
                longitude: formData.longitude,
                images: validImageUrls,
                videos: validVideoUrls,
                audio_url: audioUrl,
                status: "available",
            });

            if (error) {
                throw error;
            }

            // Reset form
            setFormData({title: "", description: "", price: "", location: "", latitude: null, longitude: null});
            setImages([]);
            setVideos([]);
            setAudio(null);
            setImagePreviews([]);
            setOpen(false);
            onListingCreated();
        } catch (error) {
            console.error("Error creating listing:", error);
            alert("Failed to create listing. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-royal-green hover:bg-royal-green-dark">
                    <Plus className="h-4 w-4 mr-2"/>
                    Create Listing
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Listing</DialogTitle>
                    <DialogDescription>List an item for sale in your local community</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            placeholder="What are you selling?"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe your item..."
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="min-h-[100px]"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Images</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="hidden"
                                id="image-upload"
                            />
                            <Label
                                htmlFor="image-upload"
                                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md cursor-pointer transition-colors"
                            >
                                <ImageIcon className="h-4 w-4"/>
                                Add Images
                            </Label>
                            <span className="text-sm text-muted-foreground">{images.length} selected</span>
                        </div>
                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={preview || "/placeholder.svg"}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-24 object-cover rounded"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3"/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Videos</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="file"
                                accept="video/*"
                                multiple
                                onChange={handleVideoChange}
                                className="hidden"
                                id="video-upload"
                            />
                            <Label
                                htmlFor="video-upload"
                                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md cursor-pointer transition-colors"
                            >
                                <Video className="h-4 w-4"/>
                                Add Videos
                            </Label>
                            <span className="text-sm text-muted-foreground">{videos.length} selected</span>
                        </div>
                        {videos.length > 0 && (
                            <div className="space-y-1">
                                {videos.map((video, index) => (
                                    <div key={index}
                                         className="flex items-center justify-between bg-secondary/50 px-3 py-2 rounded">
                                        <span className="text-sm truncate">{video.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeVideo(index)}
                                            className="text-destructive hover:text-destructive/80"
                                        >
                                            <X className="h-4 w-4"/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Audio (Optional)</Label>
                        <div className="flex items-center gap-2">
                            <Input type="file" accept="audio/*" onChange={handleAudioChange} className="hidden"
                                   id="audio-upload"/>
                            <Label
                                htmlFor="audio-upload"
                                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md cursor-pointer transition-colors"
                            >
                                <Music className="h-4 w-4"/>
                                Add Audio
                            </Label>
                            {audio && <span className="text-sm text-muted-foreground truncate">{audio.name}</span>}
                        </div>
                    </div>
                    {/* </CHANGE> */}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price ($)</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <LocationAutocomplete
                                id="location"
                                value={formData.location}
                                onChange={(value, coords) =>
                                    setFormData({
                                        ...formData,
                                        location: value,
                                        latitude: coords?.lat || null,
                                        longitude: coords?.lon || null,
                                    })
                                }
                                placeholder="City, State"
                                required
                            />
                            {/* </CHANGE> */}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-royal-green hover:bg-royal-green-dark">
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                                    Creating...
                                </>
                            ) : (
                                "Create Listing"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
