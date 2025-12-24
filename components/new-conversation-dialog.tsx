"use client";

import {Search, X} from "lucide-react";
import {useEffect, useState} from "react";

import {RichTextEditor} from "@/components/rich-text-editor";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {createBrowserClient} from "@/lib/supabase/client";

interface NewConversationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentUserId: string
    messageType: "normal" | "dating" | "group"
    onConversationCreated: (conversationId: string) => void
}

export function NewConversationDialog({
                                          open,
                                          onOpenChange,
                                          currentUserId,
                                          messageType,
                                          onConversationCreated,
                                      }: NewConversationDialogProps) {
    const [recipients, setRecipients] = useState<Array<{
        id: string;
        username: string;
        display_name: string | null
    }>>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [maxRecipients, setMaxRecipients] = useState(5);
    const supabase = createBrowserClient();

    useEffect(() => {
        // Check if user is subscribed for higher recipient limit
        const checkSubscription = async () => {
            const {data} = await supabase
                .from("subscriptions")
                .select("tier")
                .eq("user_id", currentUserId)
                .eq("status", "active")
                .maybeSingle();

            if (data && data.tier !== "free") {
                setMaxRecipients(10);
            }
        };
        checkSubscription();
    }, [currentUserId]);

    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const searchUsers = async () => {
            const {data} = await supabase
                .from("profiles")
                .select("id, username, display_name, avatar_url, message_privacy_scope, allow_dating_messages")
                .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
                .neq("id", currentUserId)
                .limit(20);

            if (!data) {
                setSearchResults([]);
                return;
            }

            // Filter results based on privacy settings and intended message type
            const filtered = await Promise.all(data.map(async (profile) => {
                // Dating restriction check
                if (messageType === "dating" && profile.allow_dating_messages === false) {
                    return null;
                }

                // Privacy scope check (Friends/Followers)
                if (profile.message_privacy_scope === "friends") {
                    const {data: friend} = await supabase
                        .from("friendships")
                        .select("id")
                        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${currentUserId})`)
                        .eq("status", "accepted")
                        .maybeSingle();
                    if (!friend) return null;
                } else if (profile.message_privacy_scope === "followers") {
                    const {data: follow} = await supabase
                        .from("follows")
                        .select("id")
                        .eq("follower_id", currentUserId)
                        .eq("following_id", profile.id)
                        .maybeSingle();
                    if (!follow) {
                        const {data: friend} = await supabase
                            .from("friendships")
                            .select("id")
                            .or(`and(user_id.eq.${currentUserId},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${currentUserId})`)
                            .eq("status", "accepted")
                            .maybeSingle();
                        if (!friend) return null;
                    }
                }

                return profile;
            }));

            setSearchResults(filtered.filter(p => p !== null));
        };

        const debounce = setTimeout(searchUsers, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, currentUserId]);

    const addRecipient = (user: any) => {
        if (recipients.length >= maxRecipients) {
            alert(`Maximum ${maxRecipients} recipients allowed`);
            return;
        }
        if (!recipients.find((r) => r.id === user.id)) {
            setRecipients([...recipients, user]);
            setSearchQuery("");
            setSearchResults([]);
        }
    };

    const removeRecipient = (userId: string) => {
        setRecipients(recipients.filter((r) => r.id !== userId));
    };

    const createConversation = async () => {
        if (recipients.length === 0) {
            alert("Please add at least one recipient");
            return;
        }
        if (!message.trim()) {
            alert("Please enter a message");
            return;
        }

        setIsCreating(true);

        try {
            // Create conversation
            const {data: conv, error: convError} = await supabase
                .from("conversations")
                .insert({
                    type: messageType,
                    message_type: messageType,
                    name: subject || undefined,
                })
                .select()
                .single();

            if (convError || !conv) {
                throw new Error("Failed to create conversation");
            }

            // Add participants
            const participants = [
                {conversation_id: conv.id, user_id: currentUserId},
                ...recipients.map((r) => ({conversation_id: conv.id, user_id: r.id})),
            ];

            const {error: participantsError} = await supabase.from("conversation_participants").insert(participants);

            if (participantsError) {
                throw new Error("Failed to add participants");
            }

            // Send initial message
            const {error: messageError} = await supabase.from("messages").insert({
                conversation_id: conv.id,
                sender_id: currentUserId,
                content: message,
                subject: subject || undefined,
            });

            if (messageError) {
                throw new Error("Failed to send message");
            }

            onConversationCreated(conv.id);
            onOpenChange(false);
            setRecipients([]);
            setSubject("");
            setMessage("");
        } catch (error: any) {
            alert(error.message || "Failed to create conversation");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-royal-purple/20">
                <DialogHeader>
                    <DialogTitle className="text-gradient">
                        New {messageType === "dating" ? "Dating" : messageType === "group" ? "Group" : ""} Conversation
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Recipients */}
                    <div>
                        <Label>To: (Max {maxRecipients} recipients)</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {recipients.map((recipient) => (
                                <Badge key={recipient.id} variant="secondary" className="gap-1">
                                    {recipient.display_name || recipient.username}
                                    <button onClick={() => removeRecipient(recipient.id)}
                                            className="ml-1 hover:text-destructive">
                                        <X className="h-3 w-3"/>
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                            <Input
                                placeholder="Search for users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                            {searchResults.length > 0 && (
                                <div
                                    className="absolute z-10 w-full mt-1 bg-card border border-royal-purple/20 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                    {searchResults.map((user) => (
                                        <button
                                            key={user.id}
                                            onClick={() => addRecipient(user)}
                                            className="w-full px-4 py-2 text-left hover:bg-royal-purple/10 flex items-center gap-2"
                                        >
                                            {user.avatar_url && (
                                                <img
                                                    src={user.avatar_url || "/placeholder.svg"}
                                                    alt=""
                                                    className="h-8 w-8 rounded-full object-cover"
                                                />
                                            )}
                                            <div>
                                                <p className="font-medium">{user.display_name || user.username}</p>
                                                <p className="text-xs text-muted-foreground">@{user.username}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Subject */}
                    <div>
                        <Label>Subject (Optional)</Label>
                        <Input
                            placeholder="Enter subject..."
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="mt-2"
                        />
                    </div>

                    {/* Message */}
                    <div>
                        <Label>Message</Label>
                        <div className="mt-2">
                            <RichTextEditor value={message} onChange={setMessage} placeholder="Write your message..."/>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
                            Cancel
                        </Button>
                        <Button
                            onClick={createConversation}
                            disabled={isCreating || recipients.length === 0 || !message.trim()}
                            className="bg-gradient-to-r from-royal-purple to-royal-blue"
                        >
                            {isCreating ? "Sending..." : "Start Conversation"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
