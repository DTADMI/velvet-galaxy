"use client";

import {Check, Maximize, Pause, Play, Settings, Volume2, VolumeX} from "lucide-react";
import type React from "react";
import {useEffect, useRef, useState} from "react";

import {Button} from "@/components/ui/button";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";

interface VideoPlayerProps {
    src: string
    poster?: string
    className?: string
}

const QUALITY_OPTIONS = [
    {label: "Auto", value: "auto"},
    {label: "1080p HD", value: "1080p", height: 1080},
    {label: "720p", value: "720p", height: 720},
    {label: "480p", value: "480p", height: 480},
    {label: "360p", value: "360p", height: 360},
];

export function VideoPlayer({src, poster, className}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [selectedQuality, setSelectedQuality] = useState("auto");
    const [showControls, setShowControls] = useState(true);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) {
            return;
        }

        const updateTime = () => setCurrentTime(video.currentTime);
        const updateDuration = () => setDuration(video.duration);

        video.addEventListener("timeupdate", updateTime);
        video.addEventListener("loadedmetadata", updateDuration);

        return () => {
            video.removeEventListener("timeupdate", updateTime);
            video.removeEventListener("loadedmetadata", updateDuration);
        };
    }, []);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleFullscreen = () => {
        if (videoRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                videoRef.current.requestFullscreen();
            }
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number.parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleQualityChange = (quality: string) => {
        setSelectedQuality(quality);
        // In a real implementation, you would switch video sources here
        // For now, we just update the selected quality
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    return (
        <div
            className={`relative group ${className}`}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
        >
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                className="w-full h-full rounded-lg"
                onClick={togglePlay}
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                style={{userSelect: "none"}}
            />

            {/* Controls overlay */}
            <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${
                    showControls ? "opacity-100" : "opacity-0"
                }`}
            >
                {/* Progress bar */}
                <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 mb-2 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-royal-purple"
                />

                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={togglePlay}
                                className="text-white hover:bg-white/20">
                            {isPlaying ? <Pause className="h-5 w-5"/> : <Play className="h-5 w-5"/>}
                        </Button>

                        <Button variant="ghost" size="icon" onClick={toggleMute}
                                className="text-white hover:bg-white/20">
                            {isMuted ? <VolumeX className="h-5 w-5"/> : <Volume2 className="h-5 w-5"/>}
                        </Button>

                        <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Quality selector */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                                    <Settings className="h-5 w-5"/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-black/90 border-white/20">
                                <div className="px-2 py-1.5 text-xs font-semibold text-white/70">Quality</div>
                                {QUALITY_OPTIONS.map((option) => (
                                    <DropdownMenuItem
                                        key={option.value}
                                        onClick={() => handleQualityChange(option.value)}
                                        className="text-white hover:bg-white/20 cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span>{option.label}</span>
                                            {selectedQuality === option.value && <Check className="h-4 w-4 ml-2"/>}
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="ghost" size="icon" onClick={toggleFullscreen}
                                className="text-white hover:bg-white/20">
                            <Maximize className="h-5 w-5"/>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
