"use client";

import {
    Archive,
    ArrowUpDown,
    Heart,
    Inbox,
    Mail,
    MessageSquare,
    Pin,
    Plus,
    Radio,
    Search,
    Settings,
    Trash2,
    UserCheck,
    UserPlus,
    Users,
} from "lucide-react";
import {useRouter} from "next/navigation";
import type React from "react";
import {useCallback, useEffect, useState} from "react";
import {MessageThread} from "@/components/message-thread";
import {NewConversationDialog} from "@/components/new-conversation-dialog";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {createBrowserClient} from "@/lib/supabase/client";

type MessageWithConversation = {
    conversation_id: string;
    conversations: {
        message_type?: string;
        is_chat_room: boolean;
    };
};

type ConversationWithId = {
    id: string;
    conversation_id: string;
    // Add other properties as needed
};

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
    unread_count?: number
    is_pinned?: boolean
}

interface MessagesClientProps {
    conversations: Conversation[]
    currentUserId: string
}

export function MessagesClient({conversations, currentUserId}: MessagesClientProps) {
    const [selectedConversation, setSelectedConversation] = useState<string | undefined>();
    const [activeTab, setActiveTab] = useState("normal");
    const [activeInbox, setActiveInbox] = useState("all");
    const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"date" | "unread">("date");
    const [filteredConvs, setFilteredConvs] = useState<Conversation[]>(conversations);
    const [inboxCounts, setInboxCounts] = useState({
        all: 0,
        unread: 0,
        friends: 0,
        followers: 0,
        sent: 0,
        archived: 0,
    });
    const [rooms, setRooms] = useState<any[]>([]);
    const [hoveredConvId, setHoveredConvId] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createBrowserClient();

    const loadConversations = useCallback(async () => {
        if (activeTab === "rooms") {
            setFilteredConvs([]);
            return;
        }

        let query = supabase
            .from("conversations")
            .select(`
        *,
        conversation_participants!inner(user_id),
        messages(content, created_at, sender_id, is_read)
      `)
            .eq("conversation_participants.user_id", currentUserId)
            .or("is_chat_room.is.null,is_chat_room.eq.false")
            .order("updated_at", {ascending: false});

        if (activeTab === "normal") {
            query = query.eq("message_type", "normal");
        }
        if (activeTab === "dating") {
            query = query.eq("message_type", "dating");
        }
        if (activeTab === "group") {
            query = query.eq("message_type", "group");
        }

        if (activeInbox === "archived") {
            query = query.eq("is_archived", true).eq("archived_by", currentUserId);
        } else {
            query = query.or(`is_archived.is.null,is_archived.eq.false`);
        }

        if (activeInbox === "unread") {
            const {data: unreadConvs} = await supabase
                .from("messages")
                .select("conversation_id")
                .eq("is_read", false)
                .neq("sender_id", currentUserId);

            if (unreadConvs && unreadConvs.length > 0) {
                const convIds = [...new Set(unreadConvs.map((m: { conversation_id: string }) => m.conversation_id))];
                query = query.in("id", convIds);
            } else {
                setFilteredConvs([]);
                return;
            }
        }

        if (activeInbox === "friends" || activeInbox === "followers") {
            const relationQuery =
                activeInbox === "friends"
                    ? supabase
                        .from("friendships")
                        .select("friend_id, user_id")
                        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
                        .eq("status", "accepted")
                    : supabase.from("follows").select("following_id").eq("follower_id", currentUserId);

            const {data: relations} = await relationQuery;

            if (relations && relations.length > 0) {
                const relatedUserIds =
                    activeInbox === "friends"
                        ? relations.map((r: any) => (r.user_id === currentUserId ? r.friend_id : r.user_id))
                        : relations.map((r: any) => r.following_id);

                const {data: relatedConvs} = await supabase
                    .from("conversation_participants")
                    .select("conversation_id")
                    .in("user_id", relatedUserIds);

                if (relatedConvs && relatedConvs.length > 0) {
                    const convIds = [...new Set(relatedConvs.map((c: {
                        conversation_id: string
                    }) => c.conversation_id))];
                    query = query.in("id", convIds);
                } else {
                    setFilteredConvs([]);
                    return;
                }
            } else {
                setFilteredConvs([]);
                return;
            }
        }

        if (activeInbox === "sent") {
            const {data: sentMessages} = await supabase
                .from("messages")
                .select("conversation_id, created_at")
                .eq("sender_id", currentUserId)
                .order("created_at", {ascending: false});

            if (sentMessages && sentMessages.length > 0) {
                const convIds = [...new Set(sentMessages.map((m: { conversation_id: string }) => m.conversation_id))];
                query = query.in("id", convIds);
            } else {
                setFilteredConvs([]);
                return;
            }
        }

        const {data} = await query;

        if (data) {
            const processedConvs = await Promise.all(
                data.map(async (conv: any) => {
                    const {data: participants} = await supabase
                        .from("conversation_participants")
                        .select("user_id, profiles(username, display_name)")
                        .eq("conversation_id", conv.id)
                        .neq("user_id", currentUserId);

                    const otherParticipant = participants?.[0]?.profiles;

                    const lastMessage = conv.messages?.[0];

                    const unreadCount = conv.messages?.filter((m: any) => !m.is_read && m.sender_id !== currentUserId).length || 0;

                    return {
                        id: conv.id,
                        type: conv.message_type || conv.type,
                        name: conv.name,
                        updated_at: conv.updated_at,
                        last_message: lastMessage
                            ? {
                                content: lastMessage.content,
                                created_at: lastMessage.created_at,
                            }
                            : undefined,
                        other_participant: otherParticipant,
                        unread_count: unreadCount,
                        is_pinned: conv.is_pinned || false,
                    };
                }),
            );

            setFilteredConvs(processedConvs);
        }

        await calculateInboxCounts();
    }, [activeTab, activeInbox, currentUserId, supabase]);

    const calculateInboxCounts = async () => {
        const messageType = activeTab === "rooms" ? null : activeTab;

        let allQuery = supabase
            .from("conversations")
            .select("id, conversation_participants!inner(user_id), message_type")
            .eq("conversation_participants.user_id", currentUserId)
            .or("is_chat_room.is.null,is_chat_room.eq.false");

        if (messageType) {
            allQuery = allQuery.eq("message_type", messageType);
        }

        const {data: allConvs} = await allQuery;
        const allCount = allConvs?.length || 0;

        const unreadQuery = supabase
            .from("messages")
            .select("conversation_id, conversations!inner(message_type, is_chat_room)")
            .eq("is_read", false)
            .neq("sender_id", currentUserId);

        const {data: unreadMessages} = await unreadQuery;

        const unreadForType = unreadMessages?.filter((m: any) => {
            const isRoom = m.conversations?.is_chat_room === true;
            const matchesType = messageType ? m.conversations?.message_type === messageType : true;
            return !isRoom && matchesType;
        });
        const unreadCount = unreadForType ? [...new Set(unreadForType.map((m: {
            conversation_id: string
        }) => m.conversation_id))].length : 0;

        const {data: friendships} = await supabase
            .from("friendships")
            .select("friend_id, user_id")
            .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
            .eq("status", "accepted");

        let friendsCount = 0;
        if (friendships && friendships.length > 0) {
            const friendIds = friendships.map((f: any) => (f.user_id === currentUserId ? f.friend_id : f.user_id));

            const {data: friendConvs} = await supabase
                .from("conversation_participants")
                .select("conversation_id, conversations!inner(message_type, is_chat_room)")
                .in("user_id", friendIds);

            const filteredFriendConvs = friendConvs?.filter((c: any) => {
                const isRoom = c.conversations?.is_chat_room === true;
                const matchesType = messageType ? c.conversations?.message_type === messageType : true;
                return !isRoom && matchesType;
            });

            friendsCount = filteredFriendConvs ? [...new Set(filteredFriendConvs.map((c: {
                conversation_id: string
            }) => c.conversation_id))].length : 0;
        }

        const {data: follows} = await supabase.from("follows").select("following_id").eq("follower_id", currentUserId);

        let followersCount = 0;
        if (follows && follows.length > 0) {
            const followingIds = follows.map((f: any) => f.following_id);

            const {data: followerConvs} = await supabase
                .from("conversation_participants")
                .select("conversation_id, conversations!inner(message_type, is_chat_room)")
                .in("user_id", followingIds);

            const filteredFollowerConvs = followerConvs?.filter((c: any) => {
                const isRoom = c.conversations?.is_chat_room === true;
                const matchesType = messageType ? c.conversations?.message_type === messageType : true;
                return !isRoom && matchesType;
            });

            followersCount = filteredFollowerConvs
                ? [...new Set(filteredFollowerConvs.map((c: { conversation_id: string }) => c.conversation_id))].length
                : 0;
        }

        const {data: sentMessages} = await supabase
            .from("messages")
            .select("conversation_id, conversations!inner(message_type, is_chat_room)")
            .eq("sender_id", currentUserId);

        const sentForType = sentMessages?.filter((m: {
            conversations: { is_chat_room: boolean, message_type?: string },
            conversation_id: string
        }) => {
            const isRoom = m.conversations?.is_chat_room === true;
            const matchesType = messageType ? m.conversations?.message_type === messageType : true;
            return !isRoom && matchesType;
        });
        const sentCount = sentForType ? [...new Set(sentForType.map((m: {
            conversation_id: string
        }) => m.conversation_id))].length : 0;

        let archivedQuery = supabase
            .from("conversations")
            .select("id, message_type, is_chat_room")
            .eq("is_archived", true)
            .eq("archived_by", currentUserId)
            .or("is_chat_room.is.null,is_chat_room.eq.false");

        if (messageType) {
            archivedQuery = archivedQuery.eq("message_type", messageType);
        }

        const {data: archived} = await archivedQuery;
        const archivedCount = archived?.length || 0;

        setInboxCounts({
            all: allCount,
            unread: unreadCount,
            friends: friendsCount,
            followers: followersCount,
            sent: sentCount,
            archived: archivedCount,
        });
    };

    const loadRooms = useCallback(async () => {
        const {data} = await supabase
            .from("conversations")
            .select("*")
            .eq("is_chat_room", true)
            .eq("is_public", true)
            .order("created_at", {ascending: false})
            .limit(20);

        if (data) {
            const roomsWithCounts = await Promise.all(
                data.map(async (room: { id: string }) => {
                    const {count} = await supabase
                        .from("conversation_participants")
                        .select("id", {count: "exact", head: true})
                        .eq("conversation_id", room.id);

                    return {
                        ...room,
                        participant_count: count || 0,
                    };
                }),
            );
            setRooms(roomsWithCounts);
        }
    }, [supabase]);

    const counts = inboxCounts;

    const displayedConversations = filteredConvs
        .filter((c: Conversation) => {
            if (!searchQuery) {
                return true;
            }
            const query = searchQuery.toLowerCase();
            return (
                c.name?.toLowerCase().includes(query) ||
                c.other_participant?.username.toLowerCase().includes(query) ||
                c.other_participant?.display_name?.toLowerCase().includes(query)
            );
        })
        .sort((a: Conversation, b: Conversation) => {
            if (sortBy === "date") {
                return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
            }
            return (b.unread_count || 0) - (a.unread_count || 0);
        });

    const selectedConv = filteredConvs.find((c) => c.id === selectedConversation);

    const archiveConversation = async (convId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await supabase.from("conversations").update({is_archived: true, archived_by: currentUserId}).eq("id", convId);
        await loadConversations();
    };

    const unarchiveConversation = async (convId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await supabase.from("conversations").update({is_archived: false, archived_by: null}).eq("id", convId);
        await loadConversations();
    };

    const deleteConversation = async (convId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this conversation?")) {
            return;
        }

        await supabase.from("messages").delete().eq("conversation_id", convId);
        await supabase.from("conversations").delete().eq("id", convId);
        await loadConversations();
    };

    const markAsUnread = async (convId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await supabase
            .from("messages")
            .update({is_read: false})
            .eq("conversation_id", convId)
            .neq("sender_id", currentUserId);
        await loadConversations();
    };

    const pinConversation = async (convId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await supabase.from("conversations").update({is_pinned: true}).eq("id", convId);
        await loadConversations();
    };

    useEffect(() => {
        setActiveInbox("all");
        setSelectedConversation(undefined);
    }, [activeTab]);

    useEffect(() => {
        loadConversations();
    }, [activeTab, activeInbox, loadConversations]);

    useEffect(() => {
        if (activeTab === "rooms") {
            loadRooms();
            calculateInboxCounts();
        }
    }, [activeTab, calculateInboxCounts, loadRooms]);

    return (
        <div className="container mx-auto h-[calc(100vh-4rem)] p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-4 bg-background/50">
                    <TabsTrigger value="normal" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4"/>
                        <span className="hidden sm:inline">Normal</span>
                    </TabsTrigger>
                    <TabsTrigger value="dating" className="flex items-center gap-2">
                        <Heart className="h-4 w-4"/>
                        <span className="hidden sm:inline">Dating</span>
                    </TabsTrigger>
                    <TabsTrigger value="group" className="flex items-center gap-2">
                        <Users className="h-4 w-4"/>
                        <span className="hidden sm:inline">Groups</span>
                    </TabsTrigger>
                    <TabsTrigger value="rooms" className="flex items-center gap-2">
                        <Radio className="h-4 w-4"/>
                        <span className="hidden sm:inline">Rooms</span>
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
                    <div className="lg:col-span-1 space-y-2 overflow-y-auto">
                        <Button
                            onClick={() => setIsNewMessageOpen(true)}
                            className="w-full bg-linear-to-r from-royal-purple to-royal-blue mb-4"
                        >
                            <Plus className="h-4 w-4 mr-2"/>
                            New Message
                        </Button>

                        {(activeTab === "normal" || activeTab === "dating" || activeTab === "group") && (
                            <div className="space-y-1">
                                <InboxButton
                                    icon={<Inbox className="h-4 w-4"/>}
                                    label="All Messages"
                                    count={counts.all}
                                    active={activeInbox === "all"}
                                    onClick={() => setActiveInbox("all")}
                                />
                                <InboxButton
                                    icon={<Mail className="h-4 w-4"/>}
                                    label="Unread"
                                    count={counts.unread}
                                    active={activeInbox === "unread"}
                                    onClick={() => setActiveInbox("unread")}
                                />
                                <InboxButton
                                    icon={<UserCheck className="h-4 w-4"/>}
                                    label="Friends"
                                    count={counts.friends}
                                    active={activeInbox === "friends"}
                                    onClick={() => setActiveInbox("friends")}
                                />
                                <InboxButton
                                    icon={<UserPlus className="h-4 w-4"/>}
                                    label="Followers"
                                    count={counts.followers}
                                    active={activeInbox === "followers"}
                                    onClick={() => setActiveInbox("followers")}
                                />
                                <div className="border-t border-royal-purple/20 my-2"/>
                                <InboxButton
                                    icon={<Mail className="h-4 w-4"/>}
                                    label="Sent"
                                    count={counts.sent}
                                    active={activeInbox === "sent"}
                                    onClick={() => setActiveInbox("sent")}
                                />
                                <InboxButton
                                    icon={<UserPlus className="h-4 w-4"/>}
                                    label="Friend Requests"
                                    count={0}
                                    active={activeInbox === "requests"}
                                    onClick={() => setActiveInbox("requests")}
                                />
                                <InboxButton
                                    icon={<Archive className="h-4 w-4"/>}
                                    label="Archived"
                                    count={counts.archived}
                                    active={activeInbox === "archived"}
                                    onClick={() => setActiveInbox("archived")}
                                />
                            </div>
                        )}

                        {activeTab === "rooms" && (
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-muted-foreground px-3 py-2">Available Rooms</p>
                                {rooms.map((room) => (
                                    <Card
                                        key={room.id}
                                        className="p-3 hover:border-royal-purple/40 transition-all cursor-pointer"
                                        onClick={() => router.push(`/chat-rooms/${room.id}`)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Radio className="h-4 w-4 text-royal-purple"/>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate">{room.name || "Unnamed Room"}</p>
                                                <p className="text-xs text-muted-foreground">{room.participant_count} participants</p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                                {rooms.length === 0 &&
                                    <p className="text-sm text-muted-foreground px-3 py-2">No rooms available</p>}
                            </div>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-4 bg-transparent"
                            onClick={() => router.push("/settings/messages")}
                        >
                            <Settings className="h-4 w-4 mr-2"/>
                            Message Settings
                        </Button>
                    </div>

                    <div className="lg:col-span-1 space-y-2 overflow-y-auto">
                        {activeTab !== "rooms" && (
                            <>
                                <div className="flex gap-2 mb-4">
                                    <div className="relative flex-1">
                                        <Search
                                            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                        <Input
                                            placeholder="Search..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setSortBy(sortBy === "date" ? "unread" : "date")}
                                    >
                                        <ArrowUpDown className="h-4 w-4"/>
                                    </Button>
                                </div>

                                {displayedConversations.map((conv) => (
                                    <Card
                                        key={conv.id}
                                        className={`p-4 cursor-pointer transition-all relative group ${
                                            selectedConversation === conv.id
                                                ? "border-royal-purple bg-royal-purple/10"
                                                : "hover:border-royal-purple/40"
                                        }`}
                                        onClick={() => setSelectedConversation(conv.id)}
                                        onMouseEnter={() => setHoveredConvId(conv.id)}
                                        onMouseLeave={() => setHoveredConvId(null)}
                                    >
                                        {hoveredConvId === conv.id && (
                                            <div
                                                className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 bg-background/95 backdrop-blur-sm rounded-md p-1 border border-royal-purple/20 shadow-lg z-10">
                                                {activeInbox === "archived" ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={(e) => unarchiveConversation(conv.id, e)}
                                                        title="Unarchive"
                                                    >
                                                        <Archive className="h-4 w-4 text-green-500"/>
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={(e) => archiveConversation(conv.id, e)}
                                                        title="Archive"
                                                    >
                                                        <Archive className="h-4 w-4"/>
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={(e) => deleteConversation(conv.id, e)}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={(e) => markAsUnread(conv.id, e)}
                                                    title="Mark as unread"
                                                >
                                                    <Mail className="h-4 w-4"/>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={(e) => pinConversation(conv.id, e)}
                                                    title="Pin"
                                                >
                                                    <Pin className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        )}

                                        <div className="flex items-start gap-3">
                                            <div
                                                className="h-10 w-10 rounded-full bg-linear-to-br from-royal-purple to-royal-blue flex items-center justify-center text-white font-semibold">
                                                {conv.other_participant?.display_name?.[0] || conv.other_participant?.username[0] || "?"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-semibold truncate">
                                                        {conv.other_participant?.display_name ||
                                                            conv.other_participant?.username ||
                                                            conv.name ||
                                                            "Conversation"}
                                                    </p>
                                                    {(conv as any).unread_count > 0 && (
                                                        <Badge variant="destructive" className="ml-2">
                                                            {(conv as any).unread_count}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {conv.last_message && (
                                                    <p className="text-sm text-muted-foreground truncate">{conv.last_message.content}</p>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(conv.updated_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}

                                {displayedConversations.length === 0 && (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        <p>Select a conversation to start messaging</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <Card className="lg:col-span-2 border-royal-blue/20 overflow-hidden">
                        {selectedConversation && selectedConv ? (
                            <MessageThread
                                conversationId={selectedConversation}
                                currentUserId={currentUserId}
                                conversationType={selectedConv.type}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <p>Select a conversation to start messaging</p>
                            </div>
                        )}
                    </Card>
                </div>
            </Tabs>

            <NewConversationDialog
                open={isNewMessageOpen}
                onOpenChange={setIsNewMessageOpen}
                currentUserId={currentUserId}
                messageType={activeTab as "normal" | "dating" | "group"}
                onConversationCreated={(id) => {
                    setSelectedConversation(id);
                    window.location.reload();
                }}
            />
        </div>
    );
}

function InboxButton({
                         icon,
                         label,
                         count,
                         active,
                         onClick,
                     }: {
    icon: React.ReactNode
    label: string
    count: number
    active: boolean
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                active ? "bg-royal-purple/20 text-royal-purple" : "hover:bg-royal-purple/10"
            }`}
        >
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-sm font-medium">{label}</span>
            </div>
            {count > 0 && (
                <Badge variant="secondary" className="ml-auto">
                    {count}
                </Badge>
            )}
        </button>
    );
}
