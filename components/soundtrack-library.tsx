"use client";

import {Check, Music, Pause, Play} from "lucide-react";
import {useState} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {ScrollArea} from "@/components/ui/scroll-area";

const SOUNDTRACKS = [
    {
        id: "upbeat-1",
        name: "Summer Vibes",
        duration: "0:15",
        mood: "Happy",
        url: "/soundtracks/upbeat-1.mp3",
    },
    {
        id: "chill-1",
        name: "Lofi Chill",
        duration: "0:15",
        mood: "Relaxed",
        url: "/soundtracks/chill-1.mp3",
    },
    {
        id: "energetic-1",
        name: "Pump It Up",
        duration: "0:15",
        mood: "Energetic",
        url: "/soundtracks/energetic-1.mp3",
    },
    {
        id: "romantic-1",
        name: "Love Story",
        duration: "0:15",
        mood: "Romantic",
        url: "/soundtracks/romantic-1.mp3",
    },
    {
        id: "dramatic-1",
        name: "Epic Moment",
        duration: "0:15",
        mood: "Dramatic",
        url: "/soundtracks/dramatic-1.mp3",
    },
    {
        id: "funny-1",
        name: "Comedy Gold",
        duration: "0:15",
        mood: "Funny",
        url: "/soundtracks/funny-1.mp3",
    },
    {
        id: "peaceful-1",
        name: "Zen Garden",
        duration: "0:15",
        mood: "Peaceful",
        url: "/soundtracks/peaceful-1.mp3",
    },
    {
        id: "party-1",
        name: "Party Time",
        duration: "0:15",
        mood: "Party",
        url: "/soundtracks/party-1.mp3",
    },
];

interface SoundtrackLibraryProps {
    selectedSoundtrack: string | null
    onSelectSoundtrack: (url: string | null) => void
}

export function SoundtrackLibrary({selectedSoundtrack, onSelectSoundtrack}: SoundtrackLibraryProps) {
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

    const handlePlayPreview = (soundtrack: (typeof SOUNDTRACKS)[0]) => {
        if (playingId === soundtrack.id) {
            audioElement?.pause();
            setPlayingId(null);
            setAudioElement(null);
        } else {
            audioElement?.pause();
            const audio = new Audio(soundtrack.url);
            audio.play();
            audio.onended = () => {
                setPlayingId(null);
                setAudioElement(null);
            };
            setPlayingId(soundtrack.id);
            setAudioElement(audio);
        }
    };

    const handleSelect = (url: string) => {
        if (selectedSoundtrack === url) {
            onSelectSoundtrack(null);
        } else {
            onSelectSoundtrack(url);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-royal-purple"/>
                    <h3 className="font-semibold text-sm">Add Soundtrack</h3>
                </div>
                {selectedSoundtrack && (
                    <Button variant="ghost" size="sm" onClick={() => onSelectSoundtrack(null)}>
                        Clear
                    </Button>
                )}
            </div>

            <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                    {SOUNDTRACKS.map((soundtrack) => {
                        const isSelected = selectedSoundtrack === soundtrack.url;
                        const isPlaying = playingId === soundtrack.id;

                        return (
                            <Card
                                key={soundtrack.id}
                                className={`p-3 cursor-pointer transition-all hover:border-royal-purple/40 ${
                                    isSelected ? "border-royal-purple bg-royal-purple/5" : "border-border"
                                }`}
                                onClick={() => handleSelect(soundtrack.url)}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 flex-shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlayPreview(soundtrack);
                                            }}
                                        >
                                            {isPlaying ? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4"/>}
                                        </Button>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{soundtrack.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Badge variant="secondary" className="text-xs">
                                                    {soundtrack.mood}
                                                </Badge>
                                                <span
                                                    className="text-xs text-muted-foreground">{soundtrack.duration}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="flex-shrink-0">
                                            <Check className="h-5 w-5 text-royal-purple"/>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </ScrollArea>

            <p className="text-xs text-muted-foreground">
                All soundtracks are free to use and will play automatically when viewing your post.
            </p>
        </div>
    );
}
