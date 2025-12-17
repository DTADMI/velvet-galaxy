"use client";

import {Camera, Loader2, Pencil} from "lucide-react";
import {useRouter} from "next/navigation";
import type React from "react";
import {useState} from "react";

import {LocationAutocomplete} from "@/components/location-autocomplete";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
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

interface EditProfileDialogProps {
    profile: {
        username: string
        display_name: string | null
        bio: string | null
        location: string | null
        avatar_url: string | null
    }
}

export function EditProfileDialog({profile}: EditProfileDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [formData, setFormData] = useState({
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        location: profile.location || "",
        avatar_url: profile.avatar_url || "",
    });
    const router = useRouter();

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        setUploadingAvatar(true);
        const supabase = createClient();

        try {
            const {
                data: {user},
            } = await supabase.auth.getUser();
            if (!user) {
                throw new Error("Not authenticated");
            }

            const fileExt = file.name.split(".").pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const {error: uploadError} = await supabase.storage.from("media").upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const {
                data: {publicUrl},
            } = supabase.storage.from("media").getPublicUrl(filePath);

            setFormData({...formData, avatar_url: publicUrl});
        } catch (error) {
            console.error("Error uploading avatar:", error);
            alert("Failed to upload avatar. Please try again.");
        } finally {
            setUploadingAvatar(false);
        }
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

            const {error} = await supabase
                .from("profiles")
                .update({
                    display_name: formData.display_name || null,
                    bio: formData.bio || null,
                    location: formData.location || null,
                    avatar_url: formData.avatar_url || null,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", user.id);

            if (error) {
                throw error;
            }

            setOpen(false);
            router.refresh();
        } catch (error) {
            console.error("Error updating profile:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-2"/>
                    Edit Profile
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>Update your profile information</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-24 w-24 border-4 border-royal-purple/20">
                            <AvatarImage src={formData.avatar_url || undefined}/>
                            <AvatarFallback
                                className="bg-gradient-to-br from-royal-auburn via-royal-purple to-royal-blue text-white text-3xl">
                                {(formData.display_name || profile.username)[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={uploadingAvatar}
                                onClick={() => document.getElementById("avatar-upload")?.click()}
                            >
                                {uploadingAvatar ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Camera className="h-4 w-4 mr-2"/>
                                        Change Photo
                                    </>
                                )}
                            </Button>
                            <input id="avatar-upload" type="file" accept="image/*" className="hidden"
                                   onChange={handleAvatarUpload}/>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" value={profile.username} disabled className="bg-muted"/>
                        <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="display_name">Display Name</Label>
                        <Input
                            id="display_name"
                            placeholder="Your display name"
                            value={formData.display_name}
                            onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            placeholder="Tell us about yourself..."
                            value={formData.bio}
                            onChange={(e) => setFormData({...formData, bio: e.target.value})}
                            className="min-h-[100px]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <LocationAutocomplete
                            id="location"
                            value={formData.location}
                            onChange={(value) => setFormData({...formData, location: value})}
                            placeholder="City, State"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}
                                className="bg-royal-auburn hover:bg-royal-auburn-dark">
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
