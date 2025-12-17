"use client";

import {FileText, ImagePlus, Music, Upload, Video} from "lucide-react";
import {useState} from "react";

import {MultiImageUpload} from "@/components/multi-image-upload";
import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";

export function UploadButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="default"
                    size="sm"
                    className="bg-gradient-to-r from-red-900 to-purple-900 hover:from-red-800 hover:to-purple-800 shadow-lg shadow-red-900/30"
                >
                    <Upload className="h-4 w-4 mr-2"/>
                    <span className="hidden md:inline">Upload</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle
                        className="text-2xl bg-gradient-to-r from-red-900 to-purple-900 bg-clip-text text-transparent">
                        Upload Content
                    </DialogTitle>
                    <DialogDescription>Share photos, videos, audio, or writings with your network</DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="images" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="images">
                            <ImagePlus className="h-4 w-4 mr-2"/>
                            Images
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

                    <TabsContent value="images" className="mt-6">
                        <MultiImageUpload onComplete={() => setIsOpen(false)}/>
                    </TabsContent>

                    <TabsContent value="video" className="mt-6">
                        <div className="text-center py-8 text-muted-foreground">Video upload coming soon...</div>
                    </TabsContent>

                    <TabsContent value="audio" className="mt-6">
                        <div className="text-center py-8 text-muted-foreground">Audio upload coming soon...</div>
                    </TabsContent>

                    <TabsContent value="writing" className="mt-6">
                        <div className="text-center py-8 text-muted-foreground">Writing upload coming soon...</div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
