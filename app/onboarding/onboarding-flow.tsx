"use client";

import {Upload} from "lucide-react";
import {useRouter} from "next/navigation";
import type React from "react";
import {useState} from "react";

import {LinkNetLogo} from "@/components/linknet-logo";
import {LocationAutocomplete} from "@/components/location-autocomplete";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Progress} from "@/components/ui/progress";
import {Textarea} from "@/components/ui/textarea";
import {createBrowserClient} from "@/lib/supabase/client";

interface OnboardingFlowProps {
    userId: string
    existingProfile: any
}

export function OnboardingFlow({userId, existingProfile}: OnboardingFlowProps) {
    const [step, setStep] = useState(1);
    const [displayName, setDisplayName] = useState(existingProfile?.display_name || "");
    const [bio, setBio] = useState(existingProfile?.bio || "");
    const [location, setLocation] = useState(existingProfile?.location || "");
    const [avatarUrl, setAvatarUrl] = useState(existingProfile?.avatar_url || "");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createBrowserClient();

    const totalSteps = 3;
    const progress = (step / totalSteps) * 100;

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleComplete = async () => {
        setIsLoading(true);

        const {error} = await supabase
            .from("profiles")
            .update({
                display_name: displayName,
                bio: bio,
                location: location,
                avatar_url: avatarUrl,
            })
            .eq("id", userId);

        if (!error) {
            router.push("/feed");
        } else {
            console.error("Error updating profile:", error);
        }
        setIsLoading(false);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        setIsLoading(true);
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}-${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const {error: uploadError} = await supabase.storage.from("avatars").upload(filePath, file);

        if (uploadError) {
            console.error("Error uploading avatar:", uploadError);
        } else {
            const {
                data: {publicUrl},
            } = supabase.storage.from("avatars").getPublicUrl(filePath);
            setAvatarUrl(publicUrl);
        }
        setIsLoading(false);
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-6 bg-background">
            <div className="w-full max-w-2xl">
                <div className="mb-8 text-center">
                    <div className="flex justify-center mb-4">
                        <LinkNetLogo size="lg"/>
                    </div>
                    <h1 className="text-3xl font-bold text-gradient mb-2">Welcome to Velvet Galaxy</h1>
                    <p className="text-muted-foreground">Let's set up your profile</p>
                </div>

                <Progress value={progress} className="mb-6"/>

                <Card className="border-royal-purple/20">
                    <CardHeader>
                        <CardTitle>
                            {step === 1 && "Basic Information"}
                            {step === 2 && "Profile Picture"}
                            {step === 3 && "About You"}
                        </CardTitle>
                        <CardDescription>
                            {step === 1 && "Tell us your name and where you're from"}
                            {step === 2 && "Add a profile picture to help others recognize you"}
                            {step === 3 && "Share a bit about yourself"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {step === 1 && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="displayName">Display Name *</Label>
                                    <Input
                                        id="displayName"
                                        placeholder="How should we call you?"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <LocationAutocomplete
                                        id="location"
                                        value={location}
                                        onChange={(value) => setLocation(value)}
                                        placeholder="City, Country"
                                    />
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <div className="flex flex-col items-center space-y-4">
                                <Avatar className="h-32 w-32 border-4 border-royal-purple/20">
                                    <AvatarImage src={avatarUrl || undefined}/>
                                    <AvatarFallback
                                        className="bg-gradient-to-br from-royal-auburn via-royal-purple to-royal-blue text-white text-4xl">
                                        {displayName[0]?.toUpperCase() || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-center gap-2">
                                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                                        <div
                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-royal-blue to-royal-purple text-white rounded-md hover:opacity-90 transition-opacity">
                                            <Upload className="h-4 w-4"/>
                                            Upload Photo
                                        </div>
                                    </Label>
                                    <Input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarUpload}
                                        disabled={isLoading}
                                    />
                                    <p className="text-xs text-muted-foreground">JPG, PNG or GIF (max 5MB)</p>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                    id="bio"
                                    placeholder="Tell us about yourself, your interests, what you're looking for..."
                                    rows={6}
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">This will be visible on your profile</p>
                            </div>
                        )}

                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={handleBack} disabled={step === 1}>
                                Back
                            </Button>
                            {step < totalSteps ? (
                                <Button
                                    onClick={handleNext}
                                    disabled={step === 1 && !displayName}
                                    className="bg-gradient-to-r from-royal-blue to-royal-purple"
                                >
                                    Next
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleComplete}
                                    disabled={isLoading || !displayName}
                                    className="bg-gradient-to-r from-royal-green to-emerald-600"
                                >
                                    {isLoading ? "Completing..." : "Complete Setup"}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-4 text-center">
                    <Button variant="link" onClick={() => router.push("/feed")} className="text-muted-foreground">
                        Skip for now
                    </Button>
                </div>
            </div>
        </div>
    );
}
