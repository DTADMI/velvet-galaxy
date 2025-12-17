"use client";

import {FileText, ImageIcon, Music, Upload, Video} from "lucide-react";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Textarea} from "@/components/ui/textarea";

export function UploadMediaButton() {
    const [open, setOpen] = useState(false);
    const [mediaType, setMediaType] = useState<"picture" | "video" | "audio" | "writing">("picture");

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-royal-purple to-royal-blue hover:opacity-90">
                    <Upload className="h-4 w-4 mr-2"/>
                    Upload Media
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-royal-purple/20 max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-gradient">Upload New Media</DialogTitle>
                </DialogHeader>

                <Tabs value={mediaType} onValueChange={(v) => setMediaType(v as any)}>
                    <TabsList className="grid grid-cols-4 bg-background/50">
                        <TabsTrigger value="picture">
                            <ImageIcon className="h-4 w-4 mr-2"/>
                            Picture
                        </TabsTrigger>
                        <TabsTrigger value="video">
                            <Video className="h-4 w-4 mr-2"/>
                            Video
                        </TabsTrigger>
                        <TabsTrigger value="audio">
                            <Music className="h-4 w-4 mr-2"/>
                            Audio
                        </TabsTrigger>
                        <TabsTrigger value="writing">
                            <FileText className="h-4 w-4 mr-2"/>
                            Writing
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={mediaType} className="space-y-4 mt-4">
                        <div>
                            <Label>Title</Label>
                            <Input placeholder="Enter title" className="mt-2"/>
                        </div>

                        <div>
                            <Label>Description</Label>
                            <Textarea placeholder="Enter description" className="mt-2" rows={3}/>
                        </div>

                        {mediaType === "writing" ? (
                            <div>
                                <Label>Content</Label>
                                <Textarea placeholder="Write your content here..." className="mt-2" rows={10}/>
                            </div>
                        ) : (
                            <div>
                                <Label>File</Label>
                                <Input
                                    type="file"
                                    className="mt-2"
                                    accept={mediaType === "picture" ? "image/*" : mediaType === "video" ? "video/*" : "audio/*"}
                                />
                            </div>
                        )}

                        <div>
                            <Label>Tags (comma separated)</Label>
                            <Input placeholder="nature, art, photography" className="mt-2"/>
                        </div>

                        <div>
                            <Label>Album (optional)</Label>
                            <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                                <option value="">No album</option>
                                <option value="1">Summer Memories</option>
                                <option value="2">My Artwork</option>
                            </select>
                        </div>

                        <Button
                            className="w-full bg-gradient-to-r from-royal-purple to-royal-blue">Upload {mediaType}</Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
