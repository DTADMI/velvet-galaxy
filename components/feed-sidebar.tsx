"use client";

import {Activity, Clock, FileText, ImageIcon, Music, TrendingUp, Users, Video} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {cn} from "@/lib/utils";

interface FeedSidebarProps {
    activeFilter: string
    onFilterChange: (filter: string) => void
}

export function FeedSidebar({activeFilter, onFilterChange}: FeedSidebarProps) {
    const filters = [
        {id: "all", label: "Recent Activity", icon: Activity},
        {id: "posts", label: "All Posts", icon: TrendingUp},
        {id: "pictures", label: "Pictures", icon: ImageIcon},
        {id: "videos", label: "Videos", icon: Video},
        {id: "status", label: "Statuses", icon: FileText},
        {id: "audio", label: "Audio", icon: Music},
        {id: "following", label: "Following", icon: Users},
        {id: "recent", label: "Most Recent", icon: Clock},
    ];

    return (
        <Card className="border-royal-purple/20 bg-card/50 backdrop-blur-sm sticky top-24">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Feed Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
                {filters.map((filter) => {
                    const Icon = filter.icon;
                    return (
                        <Button
                            key={filter.id}
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-3 h-10",
                                activeFilter === filter.id
                                    ? "bg-royal-purple/10 text-royal-purple hover:bg-royal-purple/20 hover:text-royal-purple"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                            )}
                            onClick={() => onFilterChange(filter.id)}
                        >
                            <Icon className="h-4 w-4"/>
                            {filter.label}
                        </Button>
                    );
                })}
            </CardContent>
        </Card>
    );
}
