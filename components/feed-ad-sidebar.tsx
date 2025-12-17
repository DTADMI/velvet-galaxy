"use client";

import {Calendar, TrendingUp, Users} from "lucide-react";
import Link from "next/link";

import {AdPlaceholder} from "@/components/ad-placeholder";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

export function FeedAdSidebar() {
    return (
        <div className="space-y-6 sticky top-24">
            <AdPlaceholder size="medium" title="Featured"/>

            <AdPlaceholder size="small" title="Sponsored"/>

            {/* Trending Topics */}
            <Card className="border-royal-purple/20 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4"/>
                        Trending Topics
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {["#KinkyCommunity", "#BDSMEducation", "#FetishFriday", "#CommunityEvents"].map((tag) => (
                        <Button key={tag} variant="ghost" size="sm" className="w-full justify-start text-royal-purple"
                                asChild>
                            <Link href={`/discover?tag=${tag.slice(1)}`}>{tag}</Link>
                        </Button>
                    ))}
                </CardContent>
            </Card>

            {/* Suggested Groups */}
            <Card className="border-royal-purple/20 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4"/>
                        Suggested Groups
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                        <Link href="/groups">Explore Groups</Link>
                    </Button>
                </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="border-royal-purple/20 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4"/>
                        Upcoming Events
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                        <Link href="/events">View All Events</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
