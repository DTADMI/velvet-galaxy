"use client";

import {ArrowLeft, Loader2, Megaphone} from "lucide-react";
import {useRouter} from "next/navigation";
import type React from "react";
import {useState} from "react";

import {RichTextEditor} from "@/components/rich-text-editor";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Checkbox} from "@/components/ui/checkbox";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {createClient} from "@/lib/supabase/client";

interface EditPostFormProps {
    post: any
}

export function EditPostForm({post}: EditPostFormProps) {
    const router = useRouter();
    const [content, setContent] = useState(post.content || "");
    const [contentRating, setContentRating] = useState<"sfw" | "nsfw">(post.content_rating || "sfw");
    const [isPromotional, setIsPromotional] = useState(post.is_promotional || false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            return;
        }

        setIsLoading(true);
        const supabase = createClient();

        try {
            const {error} = await supabase
                .from("posts")
                .update({
                    content: content.trim(),
                    content_rating: contentRating,
                    is_promotional: isPromotional,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", post.id);

            if (error) {
                throw error;
            }

            router.push(`/post/${post.id}`);
        } catch (error) {
            console.error("[v0] Error updating post:", error);
            alert("Failed to update post. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-2xl mx-auto">
                <Button variant="ghost" onClick={() => router.back()} className="mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2"/>
                    Back
                </Button>

                <Card className="border-royal-purple/20">
                    <CardHeader>
                        <CardTitle className="text-2xl text-gradient">Edit Post</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="content">Content *</Label>
                                <RichTextEditor
                                    value={content}
                                    onChange={setContent}
                                    placeholder="What's on your mind?"
                                    minHeight="150px"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rating">Content Rating *</Label>
                                <Select value={contentRating} onValueChange={(v) => setContentRating(v as any)}>
                                    <SelectTrigger>
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sfw">🟢 SFW (Safe for Work)</SelectItem>
                                        <SelectItem value="nsfw">🔴 NSFW (Not Safe for Work)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="promotional"
                                    checked={isPromotional}
                                    onCheckedChange={(checked) => setIsPromotional(checked as boolean)}
                                />
                                <Label htmlFor="promotional" className="flex items-center gap-2 cursor-pointer">
                                    <Megaphone className="h-4 w-4 text-amber-500"/>
                                    Mark as Promotional
                                </Label>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={isLoading}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!content.trim() || isLoading}
                                    className="flex-1 bg-gradient-to-r from-royal-auburn to-royal-purple"
                                >
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
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
