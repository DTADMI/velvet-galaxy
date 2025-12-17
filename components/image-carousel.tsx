"use client";

import {ChevronLeft, ChevronRight} from "lucide-react";
import type React from "react";
import {useEffect, useState} from "react";

import {MediaViewer} from "@/components/media-viewer";
import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";

interface ImageCarouselProps {
    images: string[]
    alt?: string
    className?: string
}

export function ImageCarousel({images, alt = "Post images", className}: ImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle if viewer is not open (viewer has its own keyboard handling)
            if (viewerOpen) {
                return;
            }

            if (e.key === "ArrowLeft") {
                e.preventDefault();
                goToPrevious(e as any);
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                goToNext(e as any);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentIndex, viewerOpen, images.length]);

    if (!images || images.length === 0) {
        return null;
    }

    const goToPrevious = (e: React.MouseEvent | KeyboardEvent) => {
        e.preventDefault();
        if ("stopPropagation" in e) {
            e.stopPropagation();
        }
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = (e: React.MouseEvent | KeyboardEvent) => {
        e.preventDefault();
        if ("stopPropagation" in e) {
            e.stopPropagation();
        }
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const goToSlide = (index: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex(index);
    };

    const openViewer = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setViewerIndex(currentIndex);
        setViewerOpen(true);
    };

    if (images.length === 1) {
        return (
            <>
                <div className={cn("rounded-lg overflow-hidden cursor-pointer", className)} onClick={openViewer}>
                    <img
                        src={images[0] || "/placeholder.svg"}
                        alt={alt}
                        className="w-full h-auto"
                        onContextMenu={(e) => e.preventDefault()}
                        draggable={false}
                        style={{userSelect: "none"}}
                    />
                </div>
                <MediaViewer
                    open={viewerOpen}
                    onOpenChange={setViewerOpen}
                    mediaUrl={images[0]}
                    mediaType="image"
                    title={alt}
                />
            </>
        );
    }

    const allMedia = images.map((url) => ({url, type: "image" as const}));

    return (
        <>
            <div className={cn("relative rounded-lg overflow-hidden group cursor-pointer", className)}
                 onClick={openViewer}>
                {/* Main Image */}
                <img
                    src={images[currentIndex] || "/placeholder.svg"}
                    alt={`${alt} ${currentIndex + 1}`}
                    className="w-full h-auto"
                    onContextMenu={(e) => e.preventDefault()}
                    draggable={false}
                    style={{userSelect: "none"}}
                />

                {images.length > 1 && (
                    <>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 opacity-70 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm hover:bg-background shadow-lg z-10"
                            onClick={goToPrevious}
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="h-5 w-5"/>
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-70 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm hover:bg-background shadow-lg z-10"
                            onClick={goToNext}
                            aria-label="Next image"
                        >
                            <ChevronRight className="h-5 w-5"/>
                        </Button>
                    </>
                )}

                {/* Image Counter */}
                <div
                    className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
                    {currentIndex + 1}/{images.length}
                </div>

                {/* Dots Navigation */}
                {images.length > 1 && images.length <= 10 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => goToSlide(index, e)}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all",
                                    index === currentIndex ? "bg-white w-6" : "bg-white/50 hover:bg-white/75",
                                )}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            <MediaViewer
                open={viewerOpen}
                onOpenChange={setViewerOpen}
                mediaUrl={images[viewerIndex]}
                mediaType="image"
                title={alt}
                allMedia={allMedia}
                currentIndex={viewerIndex}
                onNavigate={setViewerIndex}
            />
        </>
    );
}
