"use client";

import {Pause, Play, Settings, Volume2, VolumeX} from "lucide-react";
import {useEffect, useRef, useState} from "react";

import {Button} from "@/components/ui/button";
import {Dialog, DialogContent} from "@/components/ui/dialog";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Slider} from "@/components/ui/slider";

interface VideoViewerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    videoUrl: string
    title?: string
}

export function VideoViewer({open, onOpenChange, videoUrl, title}: VideoViewerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

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
        const video = videoRef.current;
        if (!video) {
            return;
        }

        if (isPlaying) {
            video.pause();
        } else {
            video.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleVolumeChange = (value: number[]) => {
        const newVolume = value[0];
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
        }
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handlePlaybackRateChange = (rate: string) => {
        const newRate = Number.parseFloat(rate);
        setPlaybackRate(newRate);
        if (videoRef.current) {
            videoRef.current.playbackRate = newRate;
        }
    };

    const handleSeek = (value: number[]) => {
        const newTime = value[0];
        setCurrentTime(newTime);
        if (videoRef.current) {
            videoRef.current.currentTime = newTime;
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 bg-black border-royal-purple/20">
                <div className="relative group">
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-auto max-h-[80vh]"
                        onClick={togglePlay}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        controlsList="nodownload"
                        onContextMenu={(e) => e.preventDefault()}
                        style={{userSelect: "none"}}
                    />

                    <div
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        {title && <p className="text-white text-sm mb-2">{title}</p>}

                        {/* Progress bar */}
                        <Slider
                            value={[currentTime]}
                            max={duration || 100}
                            step={0.1}
                            onValueChange={handleSeek}
                            className="mb-4"
                        />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" onClick={togglePlay}
                                        className="text-white hover:bg-white/20">
                                    {isPlaying ? <Pause className="h-5 w-5"/> : <Play className="h-5 w-5"/>}
                                </Button>

                                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Volume control */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                                            {isMuted || volume === 0 ? <VolumeX className="h-5 w-5"/> :
                                                <Volume2 className="h-5 w-5"/>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-32 p-4">
                                        <Slider value={[volume]} max={1} step={0.01}
                                                onValueChange={handleVolumeChange}/>
                                    </PopoverContent>
                                </Popover>

                                {/* Playback speed */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                                            <Settings className="h-5 w-5"/>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-40">
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">Playback Speed</p>
                                            <Select value={playbackRate.toString()}
                                                    onValueChange={handlePlaybackRateChange}>
                                                <SelectTrigger>
                                                    <SelectValue/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0.25">0.25x</SelectItem>
                                                    <SelectItem value="0.5">0.5x</SelectItem>
                                                    <SelectItem value="0.75">0.75x</SelectItem>
                                                    <SelectItem value="1">Normal</SelectItem>
                                                    <SelectItem value="1.25">1.25x</SelectItem>
                                                    <SelectItem value="1.5">1.5x</SelectItem>
                                                    <SelectItem value="1.75">1.75x</SelectItem>
                                                    <SelectItem value="2">2x</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
