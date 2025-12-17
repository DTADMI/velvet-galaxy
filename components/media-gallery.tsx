"use client";

import {FileText, ImageIcon, Music, Plus, Search, Tag, Video} from "lucide-react";
import {useState} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Textarea} from "@/components/ui/textarea";

type MediaType = "picture" | "video" | "audio" | "writing"

interface MediaItem {
    id: string
    title: string
    description?: string
    media_type: MediaType
    media_url?: string
    content?: string
    thumbnail_url?: string
    tags: string[]
    created_at: string
}

interface Album {
    id: string
    title: string
    description?: string
    media_type: MediaType
    item_count: number
}

export function MediaGallery({userId, isOwnProfile}: { userId: string; isOwnProfile: boolean }) {
    const [activeTab, setActiveTab] = useState<MediaType>("picture");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

    // Mock data - replace with actual data fetching
    const albums: Album[] = [
        {
            id: "1",
            title: "Summer Memories",
            description: "Photos from summer 2024",
            media_type: "picture",
            item_count: 24,
        },
        {id: "2", title: "My Artwork", description: "Digital art collection", media_type: "picture", item_count: 15},
    ];

    const mediaItems: MediaItem[] = [
        {
            id: "1",
            title: "Sunset Beach",
            description: "Beautiful sunset at the beach",
            media_type: "picture",
            media_url: "/sunset-beach-tranquil.png",
            tags: ["nature", "sunset", "beach"],
            created_at: "2024-01-15",
        },
        {
            id: "2",
            title: "Mountain Hike",
            description: "Hiking adventure",
            media_type: "picture",
            media_url: "/mountain-hiking.png",
            tags: ["adventure", "mountains", "hiking"],
            created_at: "2024-01-20",
        },
    ];

    const getMediaIcon = (type: MediaType) => {
        switch (type) {
            case "picture":
                return <ImageIcon className="h-4 w-4"/>;
            case "video":
                return <Video className="h-4 w-4"/>;
            case "audio":
                return <Music className="h-4 w-4"/>;
            case "writing":
                return <FileText className="h-4 w-4"/>;
        }
    };

    const getMediaColor = (type: MediaType) => {
        switch (type) {
            case "picture":
                return "from-royal-green to-emerald-600";
            case "video":
                return "from-royal-orange to-amber-600";
            case "audio":
                return "from-royal-purple to-purple-600";
            case "writing":
                return "from-royal-blue to-blue-600";
        }
    };

    return (
        <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input
                        placeholder="Search by tags or title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-card/50 border-royal-purple/20"
                    />
                </div>
                {isOwnProfile && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-royal-purple to-royal-blue hover:opacity-90">
                                <Plus className="h-4 w-4 mr-2"/>
                                Upload Media
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-royal-purple/20">
                            <DialogHeader>
                                <DialogTitle className="text-gradient">Upload New Media</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label>Media Type</Label>
                                    <Tabs defaultValue="picture" className="mt-2">
                                        <TabsList className="grid grid-cols-4 bg-background/50">
                                            <TabsTrigger value="picture">Picture</TabsTrigger>
                                            <TabsTrigger value="video">Video</TabsTrigger>
                                            <TabsTrigger value="audio">Audio</TabsTrigger>
                                            <TabsTrigger value="writing">Writing</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                                <div>
                                    <Label>Title</Label>
                                    <Input placeholder="Enter title" className="mt-2"/>
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <Textarea placeholder="Enter description" className="mt-2"/>
                                </div>
                                <div>
                                    <Label>Tags (comma separated)</Label>
                                    <Input placeholder="nature, art, photography" className="mt-2"/>
                                </div>
                                <div>
                                    <Label>Album (optional)</Label>
                                    <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                                        <option value="">No album</option>
                                        {albums.map((album) => (
                                            <option key={album.id} value={album.id}>
                                                {album.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Button
                                    className="w-full bg-gradient-to-r from-royal-purple to-royal-blue">Upload</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Media Type Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MediaType)}>
                <TabsList className="grid grid-cols-4 bg-background/50">
                    <TabsTrigger
                        value="picture"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-royal-green data-[state=active]:to-emerald-600"
                    >
                        <ImageIcon className="h-4 w-4 mr-2"/>
                        Pictures
                    </TabsTrigger>
                    <TabsTrigger
                        value="video"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-royal-orange data-[state=active]:to-amber-600"
                    >
                        <Video className="h-4 w-4 mr-2"/>
                        Videos
                    </TabsTrigger>
                    <TabsTrigger
                        value="audio"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-royal-purple data-[state=active]:to-purple-600"
                    >
                        <Music className="h-4 w-4 mr-2"/>
                        Audio
                    </TabsTrigger>
                    <TabsTrigger
                        value="writing"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-royal-blue data-[state=active]:to-blue-600"
                    >
                        <FileText className="h-4 w-4 mr-2"/>
                        Writings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    {/* Albums Section */}
                    {isOwnProfile && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Albums</h3>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm"
                                                className="border-royal-purple/20 bg-transparent">
                                            <Plus className="h-4 w-4 mr-2"/>
                                            New Album
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-card border-royal-purple/20">
                                        <DialogHeader>
                                            <DialogTitle>Create New Album</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div>
                                                <Label>Album Title</Label>
                                                <Input placeholder="Enter album title" className="mt-2"/>
                                            </div>
                                            <div>
                                                <Label>Description</Label>
                                                <Textarea placeholder="Enter description" className="mt-2"/>
                                            </div>
                                            <Button className="w-full bg-gradient-to-r from-royal-purple to-royal-blue">Create
                                                Album</Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {albums
                                    .filter((a) => a.media_type === activeTab)
                                    .map((album) => (
                                        <Card
                                            key={album.id}
                                            className="p-4 cursor-pointer hover:border-royal-purple/40 transition-all bg-gradient-to-br from-card to-card/50 border-royal-purple/20"
                                            onClick={() => setSelectedAlbum(album.id)}
                                        >
                                            <div
                                                className={`h-24 rounded-lg bg-gradient-to-br ${getMediaColor(album.media_type)} flex items-center justify-center mb-3`}
                                            >
                                                {getMediaIcon(album.media_type)}
                                            </div>
                                            <h4 className="font-semibold text-sm mb-1">{album.title}</h4>
                                            <p className="text-xs text-muted-foreground">{album.item_count} items</p>
                                        </Card>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Media Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {mediaItems
                            .filter((item) => item.media_type === activeTab)
                            .map((item) => (
                                <Card
                                    key={item.id}
                                    className="overflow-hidden group hover:border-royal-purple/40 transition-all bg-card/50 border-royal-purple/20"
                                >
                                    <div className="aspect-square relative overflow-hidden">
                                        {item.media_type === "picture" && (
                                            <img
                                                src={item.media_url || "/placeholder.svg"}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                        )}
                                        {item.media_type === "video" && (
                                            <div
                                                className={`w-full h-full bg-gradient-to-br ${getMediaColor("video")} flex items-center justify-center`}
                                            >
                                                <Video className="h-12 w-12 text-white"/>
                                            </div>
                                        )}
                                        {item.media_type === "audio" && (
                                            <div
                                                className={`w-full h-full bg-gradient-to-br ${getMediaColor("audio")} flex items-center justify-center`}
                                            >
                                                <Music className="h-12 w-12 text-white"/>
                                            </div>
                                        )}
                                        {item.media_type === "writing" && (
                                            <div
                                                className={`w-full h-full bg-gradient-to-br ${getMediaColor("writing")} flex items-center justify-center p-4`}
                                            >
                                                <FileText className="h-12 w-12 text-white"/>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h4 className="font-semibold text-sm mb-2 line-clamp-1">{item.title}</h4>
                                        <div className="flex flex-wrap gap-1">
                                            {item.tags.slice(0, 3).map((tag) => (
                                                <Badge key={tag} variant="secondary"
                                                       className="text-xs bg-royal-purple/20">
                                                    <Tag className="h-3 w-3 mr-1"/>
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
