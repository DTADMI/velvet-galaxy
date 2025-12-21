"use client";

import {FileText, Filter, ImageIcon, Megaphone, Music, Video} from "lucide-react";
import {useState} from "react";

import {PostCard} from "@/components/post-card";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Label} from "@/components/ui/label";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Bookmark, ContentFilters, DEFAULT_CONTENT_FILTERS} from "@/types/bookmark";
import type {Post} from "@/types/post";

interface BookmarksClientProps {
    posts: Array<Bookmark | Post>;
}

export function BookmarksClient({posts}: BookmarksClientProps) {
    const [contentFilters, setContentFilters] = useState<ContentFilters>(DEFAULT_CONTENT_FILTERS);

    const toggleFilter = (filter: keyof typeof contentFilters) => {
        setContentFilters((prev) => ({...prev, [filter]: !prev[filter]}));
    };

    const toPost = (item: Bookmark | Post): Post => ("post" in item ? item.post : item);

    const filteredPosts = posts.filter((item) => {
        const p = toPost(item);
        // Filter by content type
        if (p.content_type === "image" && !contentFilters.image) {
            return false;
        }
        if (p.content_type === "video" && !contentFilters.video) {
            return false;
        }
        if (p.content_type === "audio" && !contentFilters.audio) {
            return false;
        }
        if (p.content_type === "writing" && !contentFilters.writing) {
            return false;
        }
        if (p.content_type === "text" && !contentFilters.text) {
            return false;
        }

        // Filter by promotional status
        if (p.is_promotional && !contentFilters.promotional) {
            return false;
        }

        return true;
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent border-royal-purple/20">
                            <Filter className="h-4 w-4"/>
                            Filters
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 bg-card border-royal-purple/20" align="end">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm">Content Types</h3>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="filter-image"
                                        checked={contentFilters.image}
                                        onCheckedChange={() => toggleFilter("image")}
                                    />
                                    <Label htmlFor="filter-image" className="flex items-center gap-2 cursor-pointer">
                                        <ImageIcon className="h-4 w-4 text-royal-purple"/>
                                        Images
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="filter-video"
                                        checked={contentFilters.video}
                                        onCheckedChange={() => toggleFilter("video")}
                                    />
                                    <Label htmlFor="filter-video" className="flex items-center gap-2 cursor-pointer">
                                        <Video className="h-4 w-4 text-royal-blue"/>
                                        Videos
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="filter-audio"
                                        checked={contentFilters.audio}
                                        onCheckedChange={() => toggleFilter("audio")}
                                    />
                                    <Label htmlFor="filter-audio" className="flex items-center gap-2 cursor-pointer">
                                        <Music className="h-4 w-4 text-royal-green"/>
                                        Audio
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="filter-writing"
                                        checked={contentFilters.writing}
                                        onCheckedChange={() => toggleFilter("writing")}
                                    />
                                    <Label htmlFor="filter-writing" className="flex items-center gap-2 cursor-pointer">
                                        <FileText className="h-4 w-4 text-royal-orange"/>
                                        Writings
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="filter-text"
                                        checked={contentFilters.text}
                                        onCheckedChange={() => toggleFilter("text")}
                                    />
                                    <Label htmlFor="filter-text" className="flex items-center gap-2 cursor-pointer">
                                        <FileText className="h-4 w-4 text-muted-foreground"/>
                                        Text Posts
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2 pt-2 border-t">
                                    <Checkbox
                                        id="filter-promotional"
                                        checked={contentFilters.promotional}
                                        onCheckedChange={() => toggleFilter("promotional")}
                                    />
                                    <Label htmlFor="filter-promotional"
                                           className="flex items-center gap-2 cursor-pointer">
                                        <Megaphone className="h-4 w-4 text-amber-500"/>
                                        Promotional
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {filteredPosts.map((item) => {
                const p = toPost(item);
                return <PostCard key={p.id} post={p}/>;
            })}

            {filteredPosts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No bookmarks match your filters. Try adjusting your filter settings!</p>
                </div>
            )}
        </div>
    );
}
