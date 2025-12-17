"use client";

import {Globe, Lock, LogOut, MessageSquare, Mic, Plus, Radio, Search, Trash2, Users, Video} from "lucide-react";
import Link from "next/link";
import type React from "react";
import {useCallback, useEffect, useState} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Textarea} from "@/components/ui/textarea";
import {createBrowserClient} from "@/lib/supabase/client";
import {SupabaseClient} from "@supabase/supabase-js";

interface ChatRoom {
    id: string
    name: string
    type: string
    room_type: string
    is_public: boolean
    participant_count: number
    description?: string
    is_member: boolean
    created_by: string
    tags?: string[]
    requires_approval?: boolean
}

interface Participation {
    conversation_id: string
}

interface CreatedRoom {
    id: string;
}

async function getUserChatRoomIds(supabase: SupabaseClient, userId: string): Promise<string[]> {
    const {data: participations} = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId);

    const {data: createdRooms} = await supabase
        .from("conversations")
        .select("id")
        .eq("is_chat_room", true)
        .eq("created_by", userId);

    return [
        ...(participations?.map((p: Participation) => p.conversation_id) || []),
        ...(createdRooms?.map((r: CreatedRoom) => r.id) || []),
    ];
}

export function ChatRoomsClient({userId}: { userId?: string }) {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [roomType, setRoomType] = useState<"text" | "audio" | "video">("text");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const supabase = createBrowserClient();

    const loadRooms = useCallback(async () => {
        let query = supabase.from("conversations").select("*").eq("is_chat_room", true);

        if (activeTab === "all" && userId) {
            // All Rooms: rooms the user created OR joined
            const roomIds = await getUserChatRoomIds(supabase, userId);

            if (roomIds.length > 0) {
                query = query.in("id", [...new Set(roomIds)]);
            } else {
                setRooms([]);
                return;
            }
        } else if (activeTab === "my-rooms" && userId) {
            // My Rooms: only rooms created by the user
            query = query.eq("created_by", userId);
        } else if (activeTab === "discover" && userId) {
            // Discover: public rooms the user hasn't joined yet
            const excludeIds = await getUserChatRoomIds(supabase, userId);

            query = query.eq("is_public", true);

            if (excludeIds.length > 0) {
                query = query.not("id", "in", `(${excludeIds.join(",")})`);
            }
        }

        const {data} = await query.order("created_at", {ascending: false}).limit(20);

        if (data) {
            const roomsWithCounts = await Promise.all(
                data.map(async (room: ChatRoom) => {
                    const {count} = await supabase
                        .from("conversation_participants")
                        .select("id", {count: "exact", head: true})
                        .eq("conversation_id", room.id);

                    const {data: memberData} = await supabase
                        .from("conversation_participants")
                        .select("id")
                        .eq("conversation_id", room.id)
                        .eq("user_id", userId || "")
                        .maybeSingle();

                    const {data: settings} = await supabase
                        .from("chat_room_settings")
                        .select("description, tags, requires_approval")
                        .eq("conversation_id", room.id)
                        .maybeSingle();

                    return {
                        id: room.id,
                        name: room.name || "Unnamed Room",
                        type: room.type,
                        room_type: room.room_type || "text",
                        is_public: room.is_public,
                        participant_count: count || 0,
                        description: settings?.description,
                        is_member: !!memberData,
                        created_by: room.created_by,
                        tags: settings?.tags || [],
                        requires_approval: settings?.requires_approval,
                    };
                }),
            );
            setRooms(roomsWithCounts);
        }
    }, [activeTab, userId, supabase]);

    const joinRoom = async (roomId: string) => {
        if (!userId) {
            return;
        }

        try {
            const {data: roomData} = await supabase
                .from("conversations")
                .select("requires_approval")
                .eq("id", roomId)
                .single();

            if (roomData?.requires_approval) {
                // Add to waiting list
                const {error} = await supabase.from("room_waiting_list").insert({
                    conversation_id: roomId,
                    user_id: userId,
                    status: "pending",
                });

                if (error) {
                    // If already in waiting list, just navigate
                    if (error.code === "23505") {
                        window.location.href = `/chat-rooms/${roomId}`;
                        return;
                    }
                    throw error;
                }

                alert("Your request to join has been sent to the room creator for approval.");
                window.location.href = `/chat-rooms/${roomId}`;
            } else {
                // Direct join for rooms without approval requirement
                await supabase.from("conversation_participants").insert({conversation_id: roomId, user_id: userId});
                window.location.href = `/chat-rooms/${roomId}`;
            }
        } catch (error) {
            console.error("[v0] Error joining room:", error);
            alert("Failed to join room");
        }
    };

    const leaveRoom = async (roomId: string) => {
        if (!userId) {
            return;
        }
        if (!confirm("Are you sure you want to leave this room?")) {
            return;
        }
        await supabase.from("conversation_participants").delete().eq("conversation_id", roomId).eq("user_id", userId);
        await loadRooms();
    };

    const createRoom = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!userId) {
            return;
        }

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const isPublic = formData.get("is_public") === "public";
        const tagsInput = formData.get("tags") as string;
        const tags = tagsInput
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0);

        console.log("[v0] Creating chat room with:", {name, roomType, isPublic, tags});

        try {
            const {data: conversation, error: convError} = await supabase
                .from("conversations")
                .insert({
                    name,
                    type: "group",
                    is_chat_room: true,
                    room_type: roomType,
                    is_public: isPublic,
                    created_by: userId,
                })
                .select()
                .single();

            if (convError) {
                console.error("[v0] Error creating conversation:", convError);
                alert(`Failed to create room: ${convError.message}`);
                return;
            }

            console.log("[v0] Conversation created:", conversation);

            if (conversation) {
                const {error: partError} = await supabase.from("conversation_participants").insert({
                    conversation_id: conversation.id,
                    user_id: userId,
                });

                if (partError) {
                    console.error("[v0] Error adding participant:", partError);
                }

                const {error: settingsError} = await supabase.from("chat_room_settings").insert({
                    conversation_id: conversation.id,
                    description,
                    tags,
                });

                if (settingsError) {
                    console.error("[v0] Error creating settings:", settingsError);
                }

                await loadRooms();

                setCreateDialogOpen(false)
                ;(e.target as HTMLFormElement).reset();
            }
        } catch (error) {
            console.error("[v0] Unexpected error:", error);
            alert("An unexpected error occurred. Please try again.");
        }
    };

    const deleteRoom = async (roomId: string) => {
        if (!userId) {
            return;
        }
        if (!confirm("Are you sure you want to delete this room? This action cannot be undone.")) {
            return;
        }

        try {
            await supabase.from("messages").delete().eq("conversation_id", roomId);
            await supabase.from("conversation_participants").delete().eq("conversation_id", roomId);
            await supabase.from("chat_room_settings").delete().eq("conversation_id", roomId);
            await supabase.from("conversations").delete().eq("id", roomId);
            await loadRooms();
        } catch (error) {
            console.error("[v0] Error deleting room:", error);
            alert("Failed to delete room");
        }
    };

    const filteredRooms = rooms.filter(
        (room) =>
            room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
    );

    const getRoomTypeIcon = (type: string) => {
        switch (type) {
            case "video":
                return <Video className="h-4 w-4"/>;
            case "audio":
                return <Mic className="h-4 w-4"/>;
            default:
                return <MessageSquare className="h-4 w-4"/>;
        }
    };

    const getRoomTypeColor = (type: string) => {
        switch (type) {
            case "video":
                return "from-royal-orange to-amber-600";
            case "audio":
                return "from-royal-purple to-purple-600";
            default:
                return "from-royal-blue to-blue-600";
        }
    };

    useEffect(() => {
        loadRooms();
    }, [activeTab, loadRooms]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input
                        placeholder="Search chat rooms..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-card/50 border-royal-purple/20"
                    />
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-linear-to-r from-royal-purple to-royal-blue hover:opacity-90">
                            <Plus className="h-4 w-4 mr-2"/>
                            Create Room
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-royal-purple/20">
                        <DialogHeader>
                            <DialogTitle className="text-gradient">Create New Chat Room</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={createRoom} className="space-y-4">
                            <div>
                                <Label>Room Name</Label>
                                <Input name="name" placeholder="Enter room name" className="mt-2" required/>
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea name="description" placeholder="Describe your room" className="mt-2"
                                          rows={3}/>
                            </div>
                            <div>
                                <Label>Tags (comma-separated)</Label>
                                <Input name="tags" placeholder="e.g., gaming, music, art" className="mt-2"/>
                                <p className="text-xs text-muted-foreground mt-1">Add tags to help others discover your
                                    room</p>
                            </div>
                            <div>
                                <Label>Room Type</Label>
                                <Tabs value={roomType} onValueChange={(v) => setRoomType(v as any)} className="mt-2">
                                    <TabsList className="grid grid-cols-3 bg-background/50">
                                        <TabsTrigger value="text">
                                            <MessageSquare className="h-4 w-4 mr-2"/>
                                            Text
                                        </TabsTrigger>
                                        <TabsTrigger value="audio">
                                            <Mic className="h-4 w-4 mr-2"/>
                                            Audio
                                        </TabsTrigger>
                                        <TabsTrigger value="video">
                                            <Video className="h-4 w-4 mr-2"/>
                                            Video
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                            <div>
                                <Label>Privacy</Label>
                                <select name="is_public"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 mt-2">
                                    <option value="public">Public - Anyone can join</option>
                                    <option value="private">Private - Invite only</option>
                                </select>
                            </div>
                            <Button type="submit" className="w-full bg-linear-to-r from-royal-purple to-royal-blue">
                                Create Room
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 bg-background/50">
                    <TabsTrigger value="all">All Rooms</TabsTrigger>
                    <TabsTrigger value="my-rooms">My Rooms</TabsTrigger>
                    <TabsTrigger value="discover">Discover</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    <p className="text-sm text-muted-foreground mb-4">
                        {activeTab === "all" && "Rooms you created or joined"}
                        {activeTab === "my-rooms" && "Rooms you created"}
                        {activeTab === "discover" && "Discover new rooms based on your interests"}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredRooms.map((room) => {
                            const isCreator = room.created_by === userId;
                            return (
                                <Card
                                    key={room.id}
                                    className="overflow-hidden hover:border-royal-purple/40 transition-all bg-card/50 border-royal-purple/20"
                                >
                                    <div
                                        className={`h-24 bg-linear-to-br ${getRoomTypeColor(room.room_type)} flex items-center justify-center relative`}
                                    >
                                        <Radio className="h-12 w-12 text-white"/>
                                        <Badge className="absolute top-2 right-2 bg-black/50">
                                            {getRoomTypeIcon(room.room_type)}
                                            <span className="ml-1 capitalize">{room.room_type}</span>
                                        </Badge>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-lg line-clamp-1">{room.name}</h3>
                                            {room.is_public ? (
                                                <Globe className="h-4 w-4 text-muted-foreground shrink-0"/>
                                            ) : (
                                                <Lock className="h-4 w-4 text-muted-foreground shrink-0"/>
                                            )}
                                        </div>
                                        {room.description && (
                                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{room.description}</p>
                                        )}
                                        {room.tags && room.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {room.tags.map((tag, idx) => (
                                                    <Badge key={idx} variant="secondary" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <Badge variant="secondary" className="bg-royal-purple/20">
                                                <Users className="h-3 w-3 mr-1"/>
                                                {room.participant_count} online
                                            </Badge>
                                            <div className="flex gap-2">
                                                {room.is_member ? (
                                                    <>
                                                        <Button size="sm" asChild
                                                                className="bg-linear-to-r from-royal-purple to-royal-blue">
                                                            <Link href={`/chat-rooms/${room.id}`}>Join</Link>
                                                        </Button>
                                                        {!isCreator && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => leaveRoom(room.id)}
                                                                className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10"
                                                                title="Leave room"
                                                            >
                                                                <LogOut className="h-4 w-4"/>
                                                            </Button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => joinRoom(room.id)}
                                                        className="bg-linear-to-r from-royal-purple to-royal-blue"
                                                    >
                                                        Join
                                                    </Button>
                                                )}
                                                {isCreator && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => deleteRoom(room.id)}
                                                        className="border-red-500/20 text-red-500 hover:bg-red-500/10"
                                                        title="Delete room"
                                                    >
                                                        <Trash2 className="h-4 w-4"/>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                    {filteredRooms.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No rooms found</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
