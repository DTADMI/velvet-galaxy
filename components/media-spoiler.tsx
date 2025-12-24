"use client";

import React, {useState} from "react";
import {Eye, EyeOff} from "lucide-react";
import {cn} from "@/lib/utils";

interface MediaSpoilerProps {
    children: React.ReactNode;
    isSpoiler?: boolean;
    className?: string;
}

export function MediaSpoiler({
                                 children,
                                 isSpoiler = false,
                                 className,
                             }: MediaSpoilerProps) {
    const [revealed, setRevealed] = useState(!isSpoiler);

    if (!isSpoiler) {
        return <div className={className}>{children}</div>;
    }

    return (
        <div
            className={cn(
                "relative overflow-hidden cursor-pointer group",
                className
            )}
            onClick={() => setRevealed(!revealed)}
        >
            <div
                className={cn(
                    "transition-all duration-300",
                    !revealed && "blur-2xl scale-105 select-none"
                )}
            >
                {children}
            </div>

            {!revealed && (
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity group-hover:bg-black/50">
                    <EyeOff className="w-8 h-8 text-white mb-2"/>
                    <span className="text-white text-sm font-medium px-3 py-1 bg-black/60 rounded-full">
            Click to reveal spoiler
          </span>
                </div>
            )}

            {revealed && isSpoiler && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setRevealed(false);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                    title="Hide spoiler"
                >
                    <Eye className="w-4 h-4"/>
                </button>
            )}
        </div>
    );
}
