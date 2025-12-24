"use client";

import type {RealtimePostgresInsertPayload} from '@supabase/supabase-js';
import {formatDistanceToNow} from "date-fns";
import {EyeOff, Paperclip, Send, Timer} from "lucide-react";
import type React from "react";
import {useEffect, useRef, useState} from "react";

import {RichTextEditor} from "@/components/rich-text-editor";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {createClient} from "@/lib/supabase/client";
import {cn} from "@/lib/utils";
import {MediaSpoiler} from "@/components/media-spoiler";
import {EphemeralMedia} from "@/components/ephemeral-media";

interface Message {
    id: string
    content: string
    created_at: string
    sender_id: string
    is_ephemeral?: boolean
    is_spoiler?: boolean
    viewed_at?: string | null
    profiles: {
        username: string
        display_name: string | null
    }
}

interface MessageThreadProps {
    conversationId: string
    currentUserId: string
    conversationType: string
}

export function MessageThread({conversationId, currentUserId, conversationType}: MessageThreadProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isEphemeral, setIsEphemeral] = useState(false);
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    };

    useEffect(() => {
        loadMessages();
        scrollToBottom();

        const supabase = createClient();

        console.log("[v0] Setting up real-time subscription for conversation:", conversationId);

        const channel = supabase
            .channel(`conversation:${conversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${conversationId}`,
                },
                async (payload: RealtimePostgresInsertPayload<{
                    id: string;
                    content: string;
                    sender_id: string;
                    created_at: string;
                    conversation_id: string;
                }>) => {
                    console.log("[v0] Real-time message received:", payload);

                    if (payload.new.sender_id === currentUserId) {
                        console.log("[v0] Skipping own message from real-time");
                        return;
                    }

                    const {data: senderData} = await supabase
                        .from("profiles")
                        .select("username, display_name")
                        .eq("id", payload.new.sender_id)
                        .single();

                    const newMsg: Message = {
                        id: payload.new.id,
                        content: payload.new.content,
                        created_at: payload.new.created_at,
                        sender_id: payload.new.sender_id,
                        profiles: senderData || {username: "Unknown", display_name: null},
                    };

                    console.log("[v0] Adding message to state:", newMsg);
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === newMsg.id)) {
                            console.log("[v0] Message already exists, skipping");
                            return prev;
                        }
                        return [...prev, newMsg];
                    });
                },
            )
            .subscribe((status: string) => {
                console.log("[v0] Subscription status:", status);
            });

        return () => {
            console.log("[v0] Cleaning up subscription");
            supabase.removeChannel(channel);
        };
    }, [conversationId, currentUserId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        const supabase = createClient();
        const {data} = await supabase
            .from("messages")
            .select(
                `
        id,
        content,
        created_at,
        sender_id,
        is_ephemeral,
        is_spoiler,
        viewed_at,
        profiles (
          username,
          display_name
        )
      `,
            )
            .eq("conversation_id", conversationId)
            .order("created_at", {ascending: true});

        if (data) {
            setMessages(data);
        }
    };

    const handleViewEphemeral = async (messageId: string) => {
        const supabase = createClient();
        const viewedAt = new Date().toISOString();

        const {error} = await supabase
            .from("messages")
            .update({viewed_at: viewedAt})
            .eq("id", messageId);

        if (!error) {
            setMessages(prev => prev.map(m =>
                m.id === messageId ? {...m, viewed_at: viewedAt} : m
            ));
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) {
            return;
        }

        setIsLoading(true);
        const supabase = createClient();

        try {
            console.log("[v0] Sending message...");
            const {data, error} = await supabase
                .from("messages")
                .insert({
                    conversation_id: conversationId,
                    sender_id: currentUserId,
                    content: newMessage.trim(),
                    is_ephemeral: isEphemeral,
                    is_spoiler: isSpoiler,
                })
                .select(`
        id,
        content,
        created_at,
        sender_id,
        is_ephemeral,
        is_spoiler,
        viewed_at,
        profiles (
          username,
          display_name
        )
      `)
                .single();

            if (error) {
                throw error;
            }

            console.log("[v0] Message sent successfully:", data);

            if (data) {
                setMessages((prev) => [...prev, data]);
            }

            setNewMessage("");
            setIsEphemeral(false);
            setIsSpoiler(false);
        } catch (error) {
            console.error("[v0] Error sending message:", error);
            alert("Failed to send message. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRichTextChange = (value: string) => {
        setNewMessage(value);
    };

    const reportMessage = async (messageId: string) => {
        const reason = prompt("Why are you reporting this message?");
        if (!reason) return;

        const supabase = createClient();
        const {error} = await supabase.from("reports").insert({
            reporter_id: currentUserId,
            target_type: "message",
            target_id: messageId,
            reason: reason,
        });

        if (!error) {
            alert("Message reported. Thank you.");
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                    const isOwn = message.sender_id === currentUserId;
                    const displayName = message.profiles.display_name || message.profiles.username;

                    return (
                        <div key={message.id} className={cn("flex gap-3", isOwn && "flex-row-reverse")}>
                            <Avatar className="h-8 w-8">
                                <AvatarFallback
                                    className={cn(
                                        "text-white text-sm",
                                        conversationType === "dating" && "bg-royal-orange",
                                        conversationType === "normal" && "bg-royal-blue",
                                        conversationType === "group" && "bg-royal-green",
                                    )}
                                >
                                    {displayName[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className={cn("flex flex-col gap-1 max-w-[70%]", isOwn && "items-end")}>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-foreground">{displayName}</span>
                                    <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(message.created_at), {addSuffix: true})}
                  </span>
                                    {!isOwn && (
                                        <button onClick={() => reportMessage(message.id)}
                                                className="text-[10px] text-muted-foreground hover:text-destructive">
                                            Report
                                        </button>
                                    )}
                                </div>
                                <Card
                                    className={cn("border-royal-blue/20 overflow-hidden", isOwn && "bg-royal-auburn text-white border-royal-auburn")}>
                                    <CardContent className="p-0">
                                        <EphemeralMedia
                                            isViewed={!!message.viewed_at}
                                            onView={() => handleViewEphemeral(message.id)}
                                            className={cn(!message.is_ephemeral && "contents")}
                                        >
                                            <MediaSpoiler isSpoiler={message.is_spoiler}>
                                                <div
                                                    className="text-sm p-3 leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                                                    dangerouslySetInnerHTML={{__html: message.content}}
                                                />
                                            </MediaSpoiler>
                                        </EphemeralMedia>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef}/>
            </div>

            <div className="border-t border-border p-4 bg-muted/20">
                <form onSubmit={handleSend} className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <Button
                            type="button"
                            variant={isEphemeral ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsEphemeral(!isEphemeral)}
                            className={cn(
                                "h-8 gap-1.5 text-[10px] font-bold uppercase tracking-tight transition-all",
                                isEphemeral && "bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-md scale-105"
                            )}
                        >
                            <Timer className="h-3.5 w-3.5"/>
                            {isEphemeral ? "Ephemeral ON" : "View Once"}
                        </Button>
                        <Button
                            type="button"
                            variant={isSpoiler ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsSpoiler(!isSpoiler)}
                            className={cn(
                                "h-8 gap-1.5 text-[10px] font-bold uppercase tracking-tight transition-all",
                                isSpoiler && "bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-md scale-105"
                            )}
                        >
                            <EyeOff className="h-3.5 w-3.5"/>
                            {isSpoiler ? "Spoiler ON" : "Spoiler"}
                        </Button>
                        <div className="flex-1"/>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Attach media (coming soon)"
                        >
                            <Paperclip className="h-4 w-4"/>
                        </Button>
                    </div>
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <RichTextEditor
                                value={newMessage}
                                onChange={handleRichTextChange}
                                placeholder={isEphemeral ? "Send a view-once message..." : "Type your message..."}
                                minHeight="60px"
                                disabled={isLoading}
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={!newMessage.trim() || isLoading}
                            className={cn(
                                "bg-royal-auburn hover:bg-royal-auburn-dark h-[62px] w-[62px] rounded-lg shrink-0 transition-all",
                                isEphemeral && "bg-amber-500 hover:bg-amber-600",
                                isSpoiler && !isEphemeral && "bg-purple-600 hover:bg-purple-700"
                            )}
                        >
                            <Send className="h-5 w-5"/>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
