"use client";

import {ChevronLeft, ChevronRight, Share2, X} from "lucide-react";
import type React from "react";
import {useEffect, useState} from "react";
import {toast} from "sonner";

import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";
import {VisuallyHidden} from "@/components/ui/visually-hidden";

interface MediaViewerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mediaUrl: string
    mediaType: "image" | "video"
    title?: string
    description?: string
    allMedia?: Array<{ url: string; type: "image" | "video"; title?: string }>
    currentIndex?: number
    onNavigate?: (index: number) => void
}

export function MediaViewer({
                                open,
                                onOpenChange,
                                mediaUrl,
                                mediaType,
                                title,
                                description,
                                allMedia,
                                currentIndex = 0,
                                onNavigate,
                            }: MediaViewerProps) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                handlePrevious();
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                handleNext();
            } else if (e.key === "Escape") {
                e.preventDefault();
                onOpenChange(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, currentIndex, allMedia, onNavigate]);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title || "Shared media",
                    text: description || "",
                    url: mediaUrl,
                });
                toast.success("Shared successfully");
            } catch (error) {
                console.error("[v0] Share error:", error);
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(mediaUrl);
            toast.success("Link copied to clipboard");
        }
    };

    const handlePrevious = () => {
        if (allMedia && onNavigate && currentIndex > 0) {
            onNavigate(currentIndex - 1);
        } else if (onNavigate && currentIndex === 0) {
            // Close or trigger callback when reaching beginning
            onOpenChange(false);
        }
    };

    const handleNext = () => {
        if (allMedia && onNavigate && currentIndex < allMedia.length - 1) {
            onNavigate(currentIndex + 1);
        } else if (allMedia && onNavigate && currentIndex === allMedia.length - 1) {
            // Close or trigger callback when reaching end
            onOpenChange(false);
        }
    };

    const handleMediaClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!allMedia || allMedia.length <= 1) {
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;

        // Left third of the image
        if (clickX < width / 3 && currentIndex > 0) {
            e.stopPropagation();
            handlePrevious();
        }
        // Right third of the image
        else if (clickX > (width * 2) / 3 && currentIndex < allMedia.length - 1) {
            e.stopPropagation();
            handleNext();
        }
    };

    const hasMultipleMedia = allMedia && allMedia.length > 1;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95 border-royal-purple/20">
                <VisuallyHidden>
                    <DialogTitle>{title || "Media Viewer"}</DialogTitle>
                </VisuallyHidden>

                <div className="relative w-full h-full flex flex-col">
                    {/* Header */}
                    <div
                        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
                        <div className="flex-1 min-w-0">
                            {title && <h3 className="text-lg font-semibold text-white truncate">{title}</h3>}
                            {description && <p className="text-sm text-gray-300 truncate">{description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleShare}
                                className="text-white hover:bg-white/10"
                                aria-label="Share media"
                            >
                                <Share2 className="h-4 w-4"/>
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="text-white hover:bg-white/10"
                                aria-label="Close viewer"
                            >
                                <X className="h-5 w-5"/>
                            </Button>
                        </div>
                    </div>

                    {/* Media Content */}
                    <div
                        className="flex-1 flex items-center justify-center p-4 relative"
                        onClick={handleMediaClick}
                        style={{cursor: hasMultipleMedia ? "pointer" : "default"}}
                    >
                        {mediaType === "image" ? (
                            <div className="relative group">
                                <img
                                    src={mediaUrl || "/placeholder.svg"}
                                    alt={title || "Media content"}
                                    className="max-w-full max-h-full object-contain select-none pointer-events-none"
                                    draggable={false}
                                    onLoad={() => setIsLoading(false)}
                                    onContextMenu={(e) => e.preventDefault()}
                                    style={{display: isLoading ? "none" : "block", userSelect: "none"}}
                                />
                                {/* Secure invisible overlay to block screen capture/right-click */}
                                <div className="absolute inset-0 opacity-0 z-10 select-none pointer-events-none"
                                     aria-hidden="true">
                                    Secured by Velvet Galaxy
                                </div>
                            </div>
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <video
                                    src={mediaUrl}
                                    controls
                                    controlsList="nodownload"
                                    autoPlay
                                    className="max-w-full max-h-full"
                                    onLoadedData={(e) => {
                                        setIsLoading(false);
                                        // Set default speed/volume if needed
                                        e.currentTarget.playbackRate = 1.0;
                                    }}
                                    onContextMenu={(e) => e.preventDefault()}
                                    style={{display: isLoading ? "none" : "block", userSelect: "none"}}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                {!isLoading && (
                                    <div
                                        className="absolute bottom-16 right-4 flex flex-col gap-2 bg-black/40 backdrop-blur-sm p-2 rounded-lg border border-white/10 opacity-0 hover:opacity-100 transition-opacity z-20">
                                        <p className="text-[10px] text-white font-bold uppercase text-center mb-1">Controls</p>
                                        <select
                                            className="bg-transparent text-white text-xs border border-white/20 rounded px-1"
                                            onChange={(e) => {
                                                const v = document.querySelector('video');
                                                if (v) v.playbackRate = parseFloat(e.target.value);
                                            }}
                                        >
                                            <option value="0.5" className="bg-black">0.5x</option>
                                            <option value="1.0" className="bg-black" selected>1.0x</option>
                                            <option value="1.5" className="bg-black">1.5x</option>
                                            <option value="2.0" className="bg-black">2.0x</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"/>
                            </div>
                        )}

                        {/* Navigation Arrows */}
                        {hasMultipleMedia && (
                            <>
                                {currentIndex > 0 && (
                                    <Button
                                        size="lg"
                                        variant="ghost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePrevious();
                                        }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 bg-black/40 backdrop-blur-sm h-16 w-16 rounded-full shadow-lg"
                                        aria-label="Previous media"
                                    >
                                        <ChevronLeft className="h-8 w-8"/>
                                    </Button>
                                )}
                                {currentIndex < allMedia.length - 1 && (
                                    <Button
                                        size="lg"
                                        variant="ghost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNext();
                                        }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 bg-black/40 backdrop-blur-sm h-16 w-16 rounded-full shadow-lg"
                                        aria-label="Next media"
                                    >
                                        <ChevronRight className="h-8 w-8"/>
                                    </Button>
                                )}
                            </>
                        )}

                        {hasMultipleMedia && (
                            <>
                                {currentIndex > 0 && (
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-1/3 hover:bg-white/5 transition-colors pointer-events-none"/>
                                )}
                                {currentIndex < allMedia.length - 1 && (
                                    <div
                                        className="absolute right-0 top-0 bottom-0 w-1/3 hover:bg-white/5 transition-colors pointer-events-none"/>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer with thumbnails */}
                    {hasMultipleMedia && (
                        <div
                            className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {allMedia.map((media, index) => (
                                    <button
                                        key={index}
                                        onClick={() => onNavigate?.(index)}
                                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                            index === currentIndex ? "border-royal-purple scale-110" : "border-white/20 hover:border-white/40"
                                        }`}
                                    >
                                        {media.type === "image" ? (
                                            <img src={media.url || "/placeholder.svg"} alt=""
                                                 className="w-full h-full object-cover"/>
                                        ) : (
                                            <video src={media.url} className="w-full h-full object-cover"/>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div className="text-center text-white text-sm mt-2">
                                {currentIndex + 1} / {allMedia.length}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
