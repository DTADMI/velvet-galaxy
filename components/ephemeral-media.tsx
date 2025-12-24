"use client";

import React, {useState} from "react";
import {AlertCircle, Eye, Timer} from "lucide-react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";

interface EphemeralMediaProps {
    children: React.ReactNode;
    isViewed: boolean;
    onView: () => void;
    className?: string;
}

export function EphemeralMedia({
                                   children,
                                   isViewed,
                                   onView,
                                   className,
                               }: EphemeralMediaProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (isViewed) {
        return (
            <div className={cn("flex items-center gap-2 p-4 bg-muted/50 rounded-lg border border-dashed", className)}>
                <AlertCircle className="w-5 h-5 text-muted-foreground"/>
                <span className="text-sm text-muted-foreground font-medium">
          Media expired (view-once)
        </span>
            </div>
        );
    }

    return (
        <div className={cn("relative", className)}>
            {!isOpen ? (
                <Button
                    variant="outline"
                    className="flex items-center gap-2 h-auto py-3 px-6 bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary transition-all active:scale-95"
                    onClick={() => {
                        setIsOpen(true);
                        onView();
                    }}
                >
                    <Timer className="w-5 h-5"/>
                    <div className="flex flex-col items-start">
                        <span className="font-bold uppercase tracking-tight text-xs">View Once</span>
                        <span className="text-[10px] opacity-70 italic">Click to open media</span>
                    </div>
                </Button>
            ) : (
                <div className="relative group">
                    {children}
                    <div
                        className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded flex items-center gap-1 text-[10px] text-white backdrop-blur-sm">
                        <Eye className="w-3 h-3"/>
                        <span>OPEN (ONE-TIME VIEW)</span>
                    </div>
                </div>
            )}
        </div>
    );
}
