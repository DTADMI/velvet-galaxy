"use client";

import EmojiPicker from "emoji-picker-react";
import {
    Clock,
    LogOut,
    MessageSquare,
    Mic,
    MicOff,
    Phone,
    Send,
    Settings,
    Smile,
    Trash2,
    UserCheck,
    Users,
    UserX,
    Video,
    VideoOff,
} from "lucide-react";
import {useRouter} from "next/navigation";
import type React from "react";
import {useCallback, useEffect, useRef, useState} from "react";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Switch} from "@/components/ui/switch";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {createBrowserClient} from "@/lib/supabase/client";

interface Message {
    id: string
    content: string
    sender_id: string
    created_at: string
    sender?: {
        display_name: string
        username: string
    }
}

interface WaitingParticipant {
    id: string
    user_id: string
    status: string
    created_at: string
    profiles: {
        display_name: string
        username: string
        avatar_url: string | null
    }
}

interface ChatRoomViewProps {
    roomId: string
    userId: string
    roomType: string
    roomName: string
}

export function ChatRoomView({roomId, userId, roomType, roomName}: ChatRoomViewProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [participants, setParticipants] = useState<any[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [showChat, setShowChat] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [roomSettings, setRoomSettings] = useState({
        name: roomName,
        type: roomType,
        maxParticipants: 10,
        requiresApproval: false,
    });

    const [waitingParticipants, setWaitingParticipants] = useState<WaitingParticipant[]>([]);
    const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
    const [waitingRoomOpen, setWaitingRoomOpen] = useState(false);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const _remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createBrowserClient();
    const router = useRouter();

    // State for media devices
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedAudioInput, setSelectedAudioInput] = useState<string | undefined>(undefined);
    const [selectedVideoInput, setSelectedVideoInput] = useState<string | undefined>(undefined);
    const [selectedAudioOutput, setSelectedAudioOutput] = useState<string | undefined>(undefined);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [peerConnections, setPeerConnections] = useState<Map<string, RTCPeerConnection>>(new Map());
    const [isCreator, setIsCreator] = useState(false);
    const [_editRoomOpen, set_editRoomOpen] = useState(false);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

    const loadMediaDevices = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            setAudioDevices(devices.filter((d) => d.kind === "audioinput"));
            setVideoDevices(devices.filter((d) => d.kind === "videoinput"));
            setAudioOutputDevices(devices.filter((d) => d.kind === "audiooutput"));

            if (devices.length > 0) {
                const audioInput = devices.find((d) => d.kind === "audioinput");
                const videoInput = devices.find((d) => d.kind === "videoinput");
                const audioOutput = devices.find((d) => d.kind === "audiooutput");

                if (audioInput) {
                    setSelectedAudioInput(audioInput.deviceId);
                }
                if (videoInput) {
                    setSelectedVideoInput(videoInput.deviceId);
                }
                if (audioOutput) {
                    setSelectedAudioOutput(audioOutput.deviceId);
                }
            }
        } catch (error) {
            console.error("[v0] Error loading media devices:", error);
        }
    }, []);

    const initializeWebRTC = useCallback(async () => {
        try {
            const constraints: MediaStreamConstraints = {
                audio: roomType === "audio" || roomType === "video" ? {deviceId: selectedAudioInput || undefined} : false,
                video: roomType === "video" ? {deviceId: selectedVideoInput || undefined} : false,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setLocalStream(stream);

            if (localVideoRef.current && roomType === "video") {
                localVideoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error("[v0] Error initializing WebRTC:", error);
            alert("Failed to access camera/microphone. Please check permissions.");
        }
    }, [roomType, selectedAudioInput, selectedVideoInput]);

    const cleanupWebRTC = () => {
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
        }
        peerConnections.forEach((pc) => pc.close());
        setPeerConnections(new Map());
    };

    const changeMediaDevice = async (deviceType: "audio" | "video", deviceId: string) => {
        if (!localStream) {
            return;
        }

        try {
            const constraints: MediaStreamConstraints = {};

            if (deviceType === "audio") {
                constraints.audio = {deviceId: {exact: deviceId}};
                setSelectedAudioInput(deviceId);
            } else {
                constraints.video = {deviceId: {exact: deviceId}};
                setSelectedVideoInput(deviceId);
            }

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            const newTrack = newStream.getTracks()[0];

            const oldTrack = localStream.getTracks().find((t) => t.kind === deviceType);
            if (oldTrack) {
                localStream.removeTrack(oldTrack);
                oldTrack.stop();
            }

            localStream.addTrack(newTrack);

            if (localVideoRef.current && deviceType === "video") {
                localVideoRef.current.srcObject = localStream;
            }

            peerConnections.forEach((pc) => {
                const sender = pc.getSenders().find((s) => s.track?.kind === deviceType);
                if (sender) {
                    sender.replaceTrack(newTrack);
                }
            });
        } catch (error) {
            console.error(`[v0] Error changing ${deviceType} device:`, error);
        }
    };

    const loadMessages = useCallback(async () => {
        const {data} = await supabase
            .from("messages")
            .select("*, profiles:sender_id(display_name, username)")
            .eq("conversation_id", roomId)
            .order("created_at", {ascending: true})
            .limit(100);

        if (data) {
            setMessages(
                data.map((msg: any) => ({
                    id: msg.id,
                    content: msg.content,
                    sender_id: msg.sender_id,
                    created_at: msg.created_at,
                    sender: msg.profiles,
                })),
            );
        }
    }, [roomId, supabase]);

    const loadParticipants = useCallback(async () => {
        const {data} = await supabase
            .from("conversation_participants")
            .select("user_id, profiles(display_name, username)")
            .eq("conversation_id", roomId);

        if (data) {
            setParticipants(data);
        }
    }, [roomId, supabase]);

    const checkIfCreator = useCallback(async () => {
        const {data} = await supabase
            .from("conversations")
            .select("created_by, requires_approval")
            .eq("id", roomId)
            .single();

        if (data) {
            if (data.created_by === userId) {
                setIsCreator(true);
            }
            setRoomSettings((prev) => ({...prev, requiresApproval: data.requires_approval || false}));
        }
    }, [roomId, userId, supabase]);

    const checkWaitingRoomStatus = useCallback(async () => {
        const {data} = await supabase
            .from("room_waiting_list")
            .select("status")
            .eq("conversation_id", roomId)
            .eq("user_id", userId)
            .single();

        if (data) {
            setIsInWaitingRoom(data.status === "pending");
        }
    }, [roomId, userId, supabase]);

    const loadWaitingParticipants = useCallback(async () => {
        const {data} = await supabase
            .from("room_waiting_list")
            .select(
                `
        id,
        user_id,
        status,
        created_at,
        profiles:user_id(display_name, username, avatar_url)
      `,
            )
            .eq("conversation_id", roomId)
            .eq("status", "pending")
            .order("created_at", {ascending: true});

        if (data) {
            setWaitingParticipants(data as any);
        }
    }, [roomId, supabase]);

    const approveParticipant = async (waitingId: string, participantUserId: string) => {
        try {
            // Update waiting list status
            await supabase
                .from("room_waiting_list")
                .update({
                    status: "approved",
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: userId,
                })
                .eq("id", waitingId);

            // Add to conversation participants
            await supabase.from("conversation_participants").insert({
                conversation_id: roomId,
                user_id: participantUserId,
            });

            await loadWaitingParticipants();
            await loadParticipants();
        } catch (error) {
            console.error("[v0] Error approving participant:", error);
            alert("Failed to approve participant");
        }
    };

    const denyParticipant = async (waitingId: string) => {
        try {
            await supabase
                .from("room_waiting_list")
                .update({
                    status: "denied",
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: userId,
                })
                .eq("id", waitingId);

            await loadWaitingParticipants();
        } catch (error) {
            console.error("[v0] Error denying participant:", error);
            alert("Failed to deny participant");
        }
    };

    const handleDeleteRoom = async () => {
        if (!confirm("Are you sure you want to delete this room? This action cannot be undone.")) {
            return;
        }

        try {
            // Delete all messages first
            await supabase.from("messages").delete().eq("conversation_id", roomId);

            // Delete all participants
            await supabase.from("conversation_participants").delete().eq("conversation_id", roomId);

            await supabase.from("room_waiting_list").delete().eq("conversation_id", roomId);

            // Delete the conversation
            await supabase.from("conversations").delete().eq("id", roomId);

            router.push("/chat-rooms");
        } catch (error) {
            console.error("[v0] Error deleting room:", error);
            alert("Failed to delete room");
        }
    };

    const handleUpdateRoom = async () => {
        try {
            const {error} = await supabase
                .from("conversations")
                .update({
                    name: roomSettings.name,
                    room_type: roomSettings.type,
                    max_participants: roomSettings.maxParticipants,
                    requires_approval: roomSettings.requiresApproval,
                })
                .eq("id", roomId);

            if (error) {
                throw error;
            }

            alert("Room updated successfully");
            set_editRoomOpen(false);
            window.location.reload();
        } catch (error) {
            console.error("[v0] Error updating room:", error);
            alert("Failed to update room");
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) {
            return;
        }

        const tempId = `temp-${Date.now()}`;
        const optimisticMessage: Message = {
            id: tempId,
            content: newMessage.trim(),
            sender_id: userId,
            created_at: new Date().toISOString(),
            sender: {
                display_name: "You",
                username: "you",
            },
        };

        // Add message immediately to UI
        setMessages((prev) => [...prev, optimisticMessage]);
        const messageContent = newMessage.trim();
        setNewMessage("");

        try {
            const {data, error} = await supabase
                .from("messages")
                .insert({
                    conversation_id: roomId,
                    sender_id: userId,
                    content: messageContent,
                })
                .select()
                .single();

            if (error) {
                console.error("[v0] Error sending message:", error);
                // Remove optimistic message on error
                setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
                setNewMessage(messageContent); // Restore message content
                alert("Failed to send message");
                return;
            }

            // Replace temp message with real one
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === tempId
                        ? {
                            ...msg,
                            id: data.id,
                            created_at: data.created_at,
                        }
                        : msg,
                ),
            );
        } catch (error) {
            console.error("[v0] Error sending message:", error);
            // Remove optimistic message on error
            setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
            setNewMessage(messageContent);
        }
    };

    const handleHangUp = async () => {
        cleanupWebRTC();
        await supabase.from("conversation_participants").delete().eq("conversation_id", roomId).eq("user_id", userId);
        router.push("/chat-rooms");
    };

    const toggleMute = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const onEmojiClick = (emojiData: any) => {
        setNewMessage((prev) => prev + emojiData.emoji);
        setEmojiPickerOpen(false);
    };

    const handleLeaveRoom = async () => {
        if (!confirm("Are you sure you want to leave this room?")) {
            return;
        }

        try {
            await supabase.from("conversation_participants").delete().eq("conversation_id", roomId).eq("user_id", userId);

            cleanupWebRTC();
            router.push("/chat-rooms");
        } catch (error) {
            console.error("[v0] Error leaving room:", error);
            alert("Failed to leave room");
        }
    };

    if (isInWaitingRoom) {
        return (
            <div className="container mx-auto h-[calc(100vh-4rem)] p-4 flex items-center justify-center">
                <Card className="max-w-md w-full border-royal-purple/20 p-8 text-center">
                    <div className="mb-6">
                        <Clock className="h-16 w-16 mx-auto text-royal-purple animate-pulse"/>
                    </div>
                    <h2 className="text-2xl font-bold text-gradient mb-4">Waiting for Approval</h2>
                    <p className="text-muted-foreground mb-6">
                        You're in the waiting room for <span className="font-semibold">{roomName}</span>. The room
                        creator will
                        review your request shortly.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => router.push("/chat-rooms")}
                        className="w-full border-royal-purple/20"
                    >
                        Back to Chat Rooms
                    </Button>
                </Card>
            </div>
        );
    }

    useEffect(() => {
        loadMessages();
        loadParticipants();
        loadMediaDevices();
        checkIfCreator();
        checkWaitingRoomStatus();
        if (isCreator) {
            loadWaitingParticipants();
        }

        if (roomType !== "text") {
            initializeWebRTC();
        }

        const channel = supabase
            .channel(`room:${roomId}`, {
                config: {
                    broadcast: {self: false},
                    presence: {key: userId},
                },
            })
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${roomId}`,
                },
                async (payload: { new: { id: string; content: string; sender_id: string; created_at: string } }) => {
                    console.log("[v0] New message received:", payload);

                    // Fetch the sender profile for the new message
                    const {data: senderData} = await supabase
                        .from("profiles")
                        .select("display_name, username")
                        .eq("id", payload.new.sender_id)
                        .single();

                    const newMsg: Message = {
                        id: payload.new.id,
                        content: payload.new.content,
                        sender_id: payload.new.sender_id,
                        created_at: payload.new.created_at,
                        sender: senderData || undefined,
                    };

                    // Add message immediately to state for instant display
                    setMessages((prev) => {
                        // Prevent duplicates
                        if (prev.some((msg) => msg.id === newMsg.id)) {
                            return prev;
                        }
                        return [...prev, newMsg];
                    });
                },
            )
            .on(
                "postgres_changes",
                {event: "*", schema: "public", table: "room_waiting_list", filter: `conversation_id=eq.${roomId}`},
                () => {
                    if (isCreator) {
                        loadWaitingParticipants();
                    }
                    checkWaitingRoomStatus();
                },
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "conversation_participants",
                    filter: `conversation_id=eq.${roomId}`
                },
                () => {
                    // Reload participants when someone joins or leaves
                    loadParticipants();
                },
            )
            .subscribe((status: string) => {
                console.log("[v0] Realtime subscription status:", status);
                if (status === "SUBSCRIBED") {
                    console.log("[v0] Successfully subscribed to room updates");
                }
            });

        return () => {
            console.log("[v0] Cleaning up realtime subscription");
            supabase.removeChannel(channel);
            cleanupWebRTC();
        };
    }, [roomId, isCreator, checkIfCreator, checkWaitingRoomStatus, cleanupWebRTC, initializeWebRTC, loadMessages, loadParticipants, loadWaitingParticipants, roomType, supabase, userId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages]);

    return (
        <div className="container mx-auto h-[calc(100vh-4rem)] p-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
                <Card className="lg:col-span-3 border-royal-purple/20 flex flex-col overflow-hidden">
                    <div
                        className="p-4 border-b border-royal-purple/20 bg-linear-to-r from-royal-purple/10 to-royal-blue/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gradient">{roomName}</h2>
                                <p className="text-sm text-muted-foreground">{participants.length} participants</p>
                            </div>
                            <div className="flex gap-2">
                                {isCreator && (
                                    <>
                                        {waitingParticipants.length > 0 && (
                                            <Dialog open={waitingRoomOpen} onOpenChange={setWaitingRoomOpen}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-amber-500/20 bg-amber-500/10 text-amber-600 relative"
                                                    >
                                                        <UserCheck className="h-4 w-4 mr-2"/>
                                                        Waiting ({waitingParticipants.length})
                                                        <Badge
                                                            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-amber-500">
                                                            {waitingParticipants.length}
                                                        </Badge>
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-card border-royal-purple/20 max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Waiting Room</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                                        {waitingParticipants.map((participant) => (
                                                            <div
                                                                key={participant.id}
                                                                className="flex items-center gap-3 p-3 rounded-lg border border-royal-purple/20 bg-card/50"
                                                            >
                                                                <Avatar className="h-10 w-10">
                                                                    <AvatarFallback
                                                                        className="bg-linear-to-br from-royal-purple to-royal-blue text-xs">
                                                                        {participant.profiles?.display_name?.[0]?.toUpperCase() || "?"}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium truncate">{participant.profiles?.display_name}</p>
                                                                    <p className="text-xs text-muted-foreground truncate">
                                                                        @{participant.profiles?.username}
                                                                    </p>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => approveParticipant(participant.id, participant.user_id)}
                                                                        className="border-green-500/20 text-green-600 hover:bg-green-500/10"
                                                                    >
                                                                        <UserCheck className="h-4 w-4"/>
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => denyParticipant(participant.id)}
                                                                        className="border-red-500/20 text-red-500 hover:bg-red-500/10"
                                                                    >
                                                                        <UserX className="h-4 w-4"/>
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                                            <DialogTrigger asChild>
                                                <Button size="sm" variant="outline"
                                                        className="border-royal-purple/20 bg-transparent">
                                                    <Settings className="h-4 w-4"/>
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="bg-card border-royal-purple/20 max-w-lg">
                                                <DialogHeader>
                                                    <DialogTitle>Room Settings</DialogTitle>
                                                </DialogHeader>
                                                <Tabs defaultValue="general" className="w-full">
                                                    <TabsList className="grid w-full grid-cols-3">
                                                        <TabsTrigger value="general">General</TabsTrigger>
                                                        <TabsTrigger value="access">Access</TabsTrigger>
                                                        {roomType !== "text" &&
                                                            <TabsTrigger value="media">Media</TabsTrigger>}
                                                    </TabsList>
                                                    <TabsContent value="general" className="space-y-4">
                                                        <div>
                                                            <Label>Room Name</Label>
                                                            <Input
                                                                value={roomSettings.name}
                                                                onChange={(e) => setRoomSettings({
                                                                    ...roomSettings,
                                                                    name: e.target.value
                                                                })}
                                                                className="mt-2"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label>Room Type</Label>
                                                            <Select
                                                                value={roomSettings.type}
                                                                onValueChange={(v) => setRoomSettings({
                                                                    ...roomSettings,
                                                                    type: v
                                                                })}
                                                            >
                                                                <SelectTrigger className="mt-2">
                                                                    <SelectValue/>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="text">Text Only</SelectItem>
                                                                    <SelectItem value="audio">Audio</SelectItem>
                                                                    <SelectItem value="video">Video</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label>Max Participants</Label>
                                                            <Input
                                                                type="number"
                                                                value={roomSettings.maxParticipants}
                                                                onChange={(e) =>
                                                                    setRoomSettings({
                                                                        ...roomSettings,
                                                                        maxParticipants: Number.parseInt(e.target.value)
                                                                    })
                                                                }
                                                                className="mt-2"
                                                                min={2}
                                                                max={50}
                                                            />
                                                        </div>
                                                        <Button onClick={handleUpdateRoom} className="w-full">
                                                            Save Changes
                                                        </Button>
                                                    </TabsContent>
                                                    <TabsContent value="access" className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="space-y-0.5">
                                                                <Label>Require Approval</Label>
                                                                <p className="text-xs text-muted-foreground">
                                                                    New participants must wait for your approval before
                                                                    joining
                                                                </p>
                                                            </div>
                                                            <Switch
                                                                checked={roomSettings.requiresApproval}
                                                                onCheckedChange={(checked) =>
                                                                    setRoomSettings({
                                                                        ...roomSettings,
                                                                        requiresApproval: checked
                                                                    })
                                                                }
                                                            />
                                                        </div>
                                                        <Button onClick={handleUpdateRoom} className="w-full">
                                                            Save Changes
                                                        </Button>
                                                    </TabsContent>
                                                    {roomType !== "text" && (
                                                        <TabsContent value="media" className="space-y-4">
                                                            {roomType === "video" && (
                                                                <div>
                                                                    <Label>Camera</Label>
                                                                    {selectedVideoInput ? (
                                                                        <Select
                                                                            value={selectedVideoInput}
                                                                            onValueChange={(v) => changeMediaDevice("video", v)}
                                                                        >
                                                                            <SelectTrigger className="mt-2">
                                                                                <SelectValue
                                                                                    placeholder="Select camera"/>
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {videoDevices.map((device) => (
                                                                                    <SelectItem key={device.deviceId}
                                                                                                value={device.deviceId}>
                                                                                        {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                                                                                    </SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    ) : (
                                                                        <p className="text-sm text-muted-foreground mt-2">No
                                                                            camera detected</p>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <Label>Microphone</Label>
                                                                {selectedAudioInput ? (
                                                                    <Select
                                                                        value={selectedAudioInput}
                                                                        onValueChange={(v) => changeMediaDevice("audio", v)}
                                                                    >
                                                                        <SelectTrigger className="mt-2">
                                                                            <SelectValue
                                                                                placeholder="Select microphone"/>
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {audioDevices.map((device) => (
                                                                                <SelectItem key={device.deviceId}
                                                                                            value={device.deviceId}>
                                                                                    {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                ) : (
                                                                    <p className="text-sm text-muted-foreground mt-2">No
                                                                        microphone detected</p>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <Label>Speakers</Label>
                                                                {selectedAudioOutput ? (
                                                                    <Select value={selectedAudioOutput}
                                                                            onValueChange={setSelectedAudioOutput}>
                                                                        <SelectTrigger className="mt-2">
                                                                            <SelectValue placeholder="Select speakers"/>
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {audioOutputDevices.map((device) => (
                                                                                <SelectItem key={device.deviceId}
                                                                                            value={device.deviceId}>
                                                                                    {device.label || `Speaker ${device.deviceId.slice(0, 5)}`}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                ) : (
                                                                    <p className="text-sm text-muted-foreground mt-2">No
                                                                        speakers detected</p>
                                                                )}
                                                            </div>
                                                        </TabsContent>
                                                    )}
                                                </Tabs>
                                            </DialogContent>
                                        </Dialog>
                                        {isCreator && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleDeleteRoom}
                                                className="border-red-500/20 text-red-500 hover:bg-red-500/10 bg-transparent"
                                            >
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        )}
                                    </>
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleLeaveRoom}
                                    className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10 bg-transparent"
                                >
                                    <LogOut className="h-4 w-4 mr-2"/>
                                    Leave Room
                                </Button>
                                {roomType !== "text" && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setShowChat(!showChat)}
                                            className="border-royal-purple/20"
                                        >
                                            <MessageSquare className="h-4 w-4"/>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={isMuted ? "destructive" : "outline"}
                                            onClick={toggleMute}
                                            className="border-royal-purple/20"
                                        >
                                            {isMuted ? <MicOff className="h-4 w-4"/> : <Mic className="h-4 w-4"/>}
                                        </Button>
                                        {roomType === "video" && (
                                            <Button
                                                size="sm"
                                                variant={isVideoOff ? "destructive" : "outline"}
                                                onClick={toggleVideo}
                                                className="border-royal-purple/20"
                                            >
                                                {isVideoOff ? <VideoOff className="h-4 w-4"/> :
                                                    <Video className="h-4 w-4"/>}
                                            </Button>
                                        )}
                                        <Button size="sm" variant="destructive" onClick={handleHangUp}>
                                            <Phone className="h-4 w-4 mr-2"/>
                                            Hang Up
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {roomType === "video" && (
                        <div
                            className="h-96 bg-linear-to-br from-royal-purple/20 to-royal-blue/20 flex items-center justify-center border-b border-royal-purple/20 relative">
                            <video ref={localVideoRef} autoPlay muted playsInline
                                   className="w-full h-full object-contain"/>
                            {!localStream && (
                                <div
                                    className="absolute inset-0 flex items-center justify-center text-center text-muted-foreground bg-black/50">
                                    <div>
                                        <Video className="h-12 w-12 mx-auto mb-2"/>
                                        <p>Initializing video...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {roomType === "audio" && (
                        <div
                            className="h-32 bg-linear-to-br from-royal-purple/20 to-royal-blue/20 flex items-center justify-center border-b border-royal-purple/20">
                            <div className="text-center text-muted-foreground">
                                <Mic className="h-12 w-12 mx-auto mb-2"/>
                                <p>Audio chat active</p>
                                <p className="text-xs mt-1">{isMuted ? "Microphone muted" : "Microphone active"}</p>
                            </div>
                        </div>
                    )}

                    {(roomType === "text" || showChat) && (
                        <>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((message) => {
                                    const isOwn = message.sender_id === userId;
                                    return (
                                        <div key={message.id}
                                             className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                                            <Avatar className="h-8 w-8 shrink-0">
                                                <AvatarFallback
                                                    className={`text-xs ${isOwn ? "bg-linear-to-br from-royal-purple to-royal-blue" : "bg-linear-to-br from-royal-green to-emerald-600"}`}
                                                >
                                                    {message.sender?.display_name?.[0]?.toUpperCase() || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div
                                                className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
                        <span className="text-xs text-muted-foreground mb-1">
                          {message.sender?.display_name || "Unknown"}
                        </span>
                                                <div
                                                    className={`rounded-lg px-4 py-2 ${isOwn ? "bg-linear-to-r from-royal-purple to-royal-blue text-white" : "bg-card border border-royal-purple/20"}`}
                                                >
                                                    <p className="text-sm">{message.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef}/>
                            </div>

                            <form onSubmit={sendMessage} className="p-4 border-t border-royal-purple/20">
                                <div className="flex gap-2">
                                    <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="border-royal-purple/20 bg-transparent"
                                            >
                                                <Smile className="h-4 w-4"/>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0 border-0" align="start">
                                            <EmojiPicker onEmojiClick={onEmojiClick} width="100%"/>
                                        </PopoverContent>
                                    </Popover>
                                    <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-card/50 border-royal-purple/20"
                                    />
                                    <Button type="submit" className="bg-linear-to-r from-royal-purple to-royal-blue">
                                        <Send className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}
                </Card>

                <Card className="border-royal-purple/20 overflow-hidden">
                    <div
                        className="p-4 border-b border-royal-purple/20 bg-linear-to-r from-royal-purple/10 to-royal-blue/10">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Users className="h-4 w-4"/>
                            Participants ({participants.length})
                        </h3>
                    </div>
                    <div className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-12rem)]">
                        {participants.map((participant: any) => (
                            <div key={participant.user_id}
                                 className="flex items-center gap-3 p-2 rounded-lg hover:bg-card/50">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback
                                        className="bg-linear-to-br from-royal-purple to-royal-blue text-xs">
                                        {participant.profiles?.display_name?.[0]?.toUpperCase() || "?"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{participant.profiles?.display_name}</p>
                                    <p className="text-xs text-muted-foreground truncate">@{participant.profiles?.username}</p>
                                </div>
                                {participant.user_id === userId && (
                                    <Badge variant="secondary" className="text-xs bg-royal-purple/20">
                                        You
                                    </Badge>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
