"use client";

import {formatDistanceToNow} from "date-fns";
import {Send} from "lucide-react";
import type React from "react";
import {useEffect, useRef, useState} from "react";
import type {RealtimePostgresInsertPayload} from '@supabase/supabase-js';

import {RichTextEditor} from "@/components/rich-text-editor";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {createClient} from "@/lib/supabase/client";
import {cn} from "@/lib/utils";

interface Message {
    id: string
    content: string
    created_at: string
    sender_id: string
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
                })
                .select(`
        id,
        content,
        created_at,
        sender_id,
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
        } catch (error) {
            console.error("[v0] Error sending message:", error);
            alert("Failed to send message. Please try again.");
        } finally {
            setIsLoading(false);
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
                                </div>
                                <Card
                                    className={cn("border-royal-blue/20", isOwn && "bg-royal-auburn text-white border-royal-auburn")}>
                                    <CardContent className="p-3">
                                        <div
                                            className="text-sm leading-relaxed prose prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{__html: message.content}}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef}/>
            </div>

            <div className="border-t border-border p-4">
                <form onSubmit={handleSend} className="flex gap-2 items-end">
                    <div className="flex-1">
                        <RichTextEditor
                            value={newMessage}
                            onChange={setNewMessage}
                            placeholder="Type your message..."
                            minHeight="60px"
                            disabled={isLoading}
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={!newMessage.trim() || isLoading}
                        className="bg-royal-auburn hover:bg-royal-auburn-dark"
                    >
                        <Send className="h-4 w-4"/>
                    </Button>
                </form>
            </div>
        </div>
    );
}
