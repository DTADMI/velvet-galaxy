"use client";

import {ExternalLink} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";

interface AdPlaceholderProps {
    size?: "small" | "medium" | "large"
    title?: string
    className?: string
}

export function AdPlaceholder({size = "medium", title = "Advertisement", className = ""}: AdPlaceholderProps) {
    const sizeClasses = {
        small: "h-[200px]",
        medium: "h-[300px]",
        large: "h-[400px]",
    };

    return (
        <Card className={`border-royal-purple/20 bg-gradient-to-br from-royal-auburn/5 to-royal-purple/5 ${className}`}>
            <CardContent className="p-4 h-full flex flex-col">
                <p className="text-xs text-muted-foreground mb-3">{title}</p>
                <div
                    className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-gradient-to-br from-royal-auburn to-royal-purple flex flex-col items-center justify-center gap-3 flex-1`}
                >
                    <p className="text-white font-semibold text-lg">Your Ad Here</p>
                    <p className="text-white/80 text-sm text-center px-4">Promote your content, events, or services</p>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3 bg-transparent">
                    Learn More <ExternalLink className="h-3 w-3 ml-2"/>
                </Button>
            </CardContent>
        </Card>
    );
}
