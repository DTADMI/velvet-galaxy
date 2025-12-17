"use client";

import {ImagePlus, Loader2} from "lucide-react";
import type React from "react";
import {useState} from "react";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Textarea} from "@/components/ui/textarea";
import {createClient} from "@/lib/supabase/client";

interface CreatePostProps {
    userProfile: {
        username: string
        display_name: string | null
    }
    onPostCreated: () => void
}

export function CreatePost({userProfile, onPostCreated}: CreatePostProps) {
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
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
            });

            if (error) {
                throw error;
            }

            setContent("");
            onPostCreated();
        } catch (error) {
            console.error("Error creating post:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-royal-purple/20 bg-gradient-to-br from-card to-card/50">
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit}>
                    <div className="flex gap-4">
                        <Avatar className="h-10 w-10 ring-2 ring-royal-auburn/30">
                            <AvatarFallback className="bg-gradient-to-br from-royal-auburn to-royal-purple text-white">
                                {userProfile.display_name?.[0]?.toUpperCase() || userProfile.username[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                            <Textarea
                                placeholder="What's on your mind?"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="min-h-[100px] resize-none border-muted focus:border-royal-purple/50"
                                disabled={isLoading}
                            />
                            <div className="flex items-center justify-between">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-royal-orange hover:bg-royal-orange/10"
                                >
                                    <ImagePlus className="h-4 w-4 mr-2"/>
                                    Add Photo
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!content.trim() || isLoading}
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
            </CardContent>
        </Card>
    );
}
