"use client";

import {Send} from "lucide-react";
import {useEffect, useState} from "react";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Textarea} from "@/components/ui/textarea";
import {createBrowserClient} from "@/lib/supabase/client";

interface ShareDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    contentType: "post" | "media" | "event" | "group"
    contentId: string
    currentUserId: string
}

interface User {
    id: string
    display_name: string
    avatar_url: string | null
}

export function ShareDialog({open, onOpenChange, contentType, contentId, currentUserId}: ShareDialogProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const supabase = createBrowserClient();

    useEffect(() => {
        if (open) {
            fetchUsers();
        }
    }, [open]);

    const fetchUsers = async () => {
        // Fetch followers and following
        const {data: connections} = await supabase
            .from("follows")
            .select("follower_id, following_id")
            .or(`follower_id.eq.${currentUserId},following_id.eq.${currentUserId}`);

        if (connections) {
            const userIds = new Set<string>();
            connections.forEach((conn: any) => {
                if (conn.follower_id === currentUserId) {
                    userIds.add(conn.following_id);
                }
                if (conn.following_id === currentUserId) {
                    userIds.add(conn.follower_id);
                }
            });

            const {data: profiles} = await supabase
                .from("profiles")
                .select("id, display_name, avatar_url")
                .in("id", Array.from(userIds));

            if (profiles) {
                setUsers(profiles);
            }
        }
    };

    const handleToggleUser = (userId: string) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const handleShare = async () => {
        if (selectedUsers.size === 0) {
            return;
        }

        setSending(true);

        const shares = Array.from(selectedUsers).map((recipientId) => ({
            user_id: currentUserId,
            content_type: contentType,
            content_id: contentId,
            recipient_user_id: recipientId,
            message: message || null,
        }));

        await supabase.from("shares").insert(shares);

        // Also send as messages
        for (const recipientId of selectedUsers) {
            // Find existing conversation between these two users
            const {data: currentUserConvs} = await supabase
                .from("conversation_participants")
                .select("conversation_id")
                .eq("user_id", currentUserId);

            const {data: recipientConvs} = await supabase
                .from("conversation_participants")
                .select("conversation_id")
                .eq("user_id", recipientId);

            let conversationId: string | null = null;

            if (currentUserConvs && recipientConvs) {
                const currentConvIds = new Set(currentUserConvs.map((c: any) => c.conversation_id));
                const sharedConv = recipientConvs.find((c: any) => currentConvIds.has(c.conversation_id));

                if (sharedConv) {
                    // Verify it's a normal conversation (not a group or chat room)
                    const {data: conv} = await supabase
                        .from("conversations")
                        .select("id, type")
                        .eq("id", sharedConv.conversation_id)
                        .eq("type", "normal")
                        .single();

                    conversationId = conv?.id || null;
                }
            }

            // Create new conversation if none exists
            if (!conversationId) {
                const {data: newConv} = await supabase
                    .from("conversations")
                    .insert({
                        type: "normal",
                    })
                    .select("id")
                    .single();

                if (newConv) {
                    conversationId = newConv.id;

                    // Add both participants
                    await supabase.from("conversation_participants").insert([
                        {conversation_id: conversationId, user_id: currentUserId},
                        {conversation_id: conversationId, user_id: recipientId},
                    ]);
                }
            }

            // Send the message
            if (conversationId) {
                const shareUrl = `${window.location.origin}/${contentType === "post" ? "post" : contentType}/${contentId}`;
                const messageContent = message
                    ? `${message}\n\nShared ${contentType}: ${shareUrl}`
                    : `Shared ${contentType}: ${shareUrl}`;

                await supabase.from("messages").insert({
                    conversation_id: conversationId,
                    sender_id: currentUserId,
                    content: messageContent,
                });
            }
        }

        setSending(false);
        setSelectedUsers(new Set());
        setMessage("");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-background border-border">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Share Content</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Add a message (optional)..."
                        className="bg-card border-border"
                        rows={3}
                    />
                    <div>
                        <p className="text-sm font-medium mb-3 text-foreground">Select recipients:</p>
                        <ScrollArea className="h-[300px] border border-border rounded-lg p-2">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center gap-3 p-2 hover:bg-card rounded-lg cursor-pointer"
                                    onClick={() => handleToggleUser(user.id)}
                                >
                                    <Checkbox checked={selectedUsers.has(user.id)}/>
                                    <Avatar className="h-8 w-8 border border-royal-blue">
                                        <AvatarImage src={user.avatar_url || undefined}/>
                                        <AvatarFallback
                                            className="bg-gradient-to-br from-royal-blue to-royal-purple text-white text-xs">
                                            {user.display_name[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm text-foreground">{user.display_name}</span>
                                </div>
                            ))}
                            {users.length === 0 && (
                                <p className="text-center text-muted-foreground py-8 text-sm">
                                    No connections found. Follow users to share content with them.
                                </p>
                            )}
                        </ScrollArea>
                    </div>
                    <Button
                        onClick={handleShare}
                        disabled={selectedUsers.size === 0 || sending}
                        className="w-full bg-gradient-to-r from-royal-blue to-royal-purple"
                    >
                        <Send className="h-4 w-4 mr-2"/>
                        Share with {selectedUsers.size} {selectedUsers.size === 1 ? "person" : "people"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
