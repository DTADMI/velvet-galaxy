"use client";

import Link from "next/link";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {ScrollArea} from "@/components/ui/scroll-area";

interface LikesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    likes: Array<{
        id: string
        user_id: string
        profiles: {
            id: string
            username: string
            display_name: string | null
            avatar_url: string | null
        }
    }>
}

export function LikesDialog({open, onOpenChange, likes}: LikesDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Likes</DialogTitle>
                    <DialogDescription>
                        {likes.length} {likes.length === 1 ? "person" : "people"} liked this
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[400px] pr-4">
                    <div className="space-y-3">
                        {likes.map((like) => (
                            <Link
                                key={like.id}
                                href={`/profile/${like.profiles.id}`}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                                onClick={() => onOpenChange(false)}
                            >
                                <Avatar className="h-10 w-10 ring-2 ring-royal-purple/20">
                                    <AvatarImage src={like.profiles.avatar_url || undefined}/>
                                    <AvatarFallback
                                        className="bg-gradient-to-br from-royal-purple to-royal-blue text-white">
                                        {(like.profiles.display_name || like.profiles.username)[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-foreground">{like.profiles.display_name || like.profiles.username}</p>
                                    <p className="text-sm text-muted-foreground">@{like.profiles.username}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
