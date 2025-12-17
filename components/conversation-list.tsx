"use client";

import {formatDistanceToNow} from "date-fns";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Card} from "@/components/ui/card";
import {cn} from "@/lib/utils";

interface Conversation {
    id: string
    type: string
    name: string | null
    updated_at: string
    last_message?: {
        content: string
        created_at: string
    }
    other_participant?: {
        username: string
        display_name: string | null
    }
}

interface ConversationListProps {
    conversations: Conversation[]
    selectedId?: string
    onSelect: (id: string) => void
}

export function ConversationList({conversations, selectedId, onSelect}: ConversationListProps) {
    if (conversations.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground p-8 text-center">
                <p>No conversations yet. Start a new conversation to get started!</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {conversations.map((conversation) => {
                const displayName =
                    conversation.type === "group"
                        ? conversation.name || "Group Chat"
                        : conversation.other_participant?.display_name || conversation.other_participant?.username || "Unknown";

                return (
                    <Card
                        key={conversation.id}
                        className={cn(
                            "p-4 cursor-pointer transition-all hover:bg-accent/50 border-royal-blue/20",
                            selectedId === conversation.id && "bg-accent border-royal-purple shadow-md shadow-royal-purple/20",
                        )}
                        onClick={() => onSelect(conversation.id)}
                    >
                        <div className="flex items-start gap-3">
                            <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-offset-background ring-opacity-50">
                                <AvatarFallback
                                    className={cn(
                                        "text-white font-semibold",
                                        conversation.type === "dating" && "bg-gradient-to-br from-royal-orange to-yellow",
                                        conversation.type === "normal" && "bg-gradient-to-br from-royal-blue to-royal-purple",
                                        conversation.type === "group" && "bg-gradient-to-br from-royal-green to-royal-blue",
                                    )}
                                >
                                    {displayName[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-semibold text-foreground truncate">{displayName}</p>
                                    {conversation.last_message && (
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(conversation.last_message.created_at), {addSuffix: true})}
                    </span>
                                    )}
                                </div>
                                {conversation.last_message && (
                                    <p className="text-sm text-muted-foreground truncate">{conversation.last_message.content}</p>
                                )}
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
