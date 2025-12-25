"use client";

import {Clock, Eye, EyeOff, UserCheck, UserPlus, UserX} from "lucide-react";
import {useEffect, useState} from "react";
import {toast} from "sonner";

import {Button} from "@/components/ui/button";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {createBrowserClient} from "@/lib/supabase/client";

interface FriendButtonProps {
    userId: string
}

export function FriendButton({userId, onStatusChange}: { userId: string; onStatusChange?: () => void }) {
    const [friendshipStatus, setFriendshipStatus] = useState<"none" | "pending" | "accepted" | "sent">("none");
    const [isMuted, setIsMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createBrowserClient();

    useEffect(() => {
        checkFriendshipStatus();
    }, [userId]);

    const checkFriendshipStatus = async () => {
        const {
            data: {user},
        } = await supabase.auth.getUser();
        if (!user) {
            return;
        }

        // Check if there's an existing friendship
        const {data: sentRequest} = await supabase
            .from("friendships")
            .select("status, is_muted")
            .eq("user_id", user.id)
            .eq("friend_id", userId)
            .maybeSingle();

        if (sentRequest) {
            setFriendshipStatus(sentRequest.status === "accepted" ? "accepted" : "sent");
            setIsMuted(!!sentRequest.is_muted);
            return;
        }

        // Check if there's a received request
        const {data: receivedRequest} = await supabase
            .from("friendships")
            .select("status, is_muted")
            .eq("user_id", userId)
            .eq("friend_id", user.id)
            .maybeSingle();

        if (receivedRequest) {
            setFriendshipStatus(receivedRequest.status === "accepted" ? "accepted" : "pending");
            // Mute status for incoming friendships is handled by the receiver's perspective in the table
            // But if the relation is bidirectional, we should check both.
            // In Fetlife style, you can be friends and choose not to follow.
        }
    };

    const toggleMute = async () => {
        setIsLoading(true);
        const {data: {user}} = await supabase.auth.getUser();
        if (!user) return;

        const newMuted = !isMuted;
        const {error} = await supabase
            .from("friendships")
            .update({is_muted: newMuted})
            .eq("user_id", user.id)
            .eq("friend_id", userId);

        if (!error) {
            setIsMuted(newMuted);
            toast.success(newMuted ? "Friend muted (not following in feed)" : "Following friend in feed");
        }
        setIsLoading(false);
    };

    const sendFriendRequest = async () => {
        setIsLoading(true);
        const {
            data: {user},
        } = await supabase.auth.getUser();
        if (!user) {
            return;
        }

        const {error} = await supabase.from("friendships").insert({
            user_id: user.id,
            friend_id: userId,
            status: "pending",
        });

        if (!error) {
            setFriendshipStatus("sent");
            if (onStatusChange) onStatusChange();

            await supabase.from("notifications").insert({
                user_id: userId,
                from_user_id: user.id,
                type: "friend_request",
                title: "Friend Request",
                message: "sent you a friend request",
                link: `/profile/${user.id}`,
            });
        }
        setIsLoading(false);
    };

    const acceptFriendRequest = async () => {
        setIsLoading(true);
        const {
            data: {user},
        } = await supabase.auth.getUser();
        if (!user) {
            return;
        }

        const {error} = await supabase
            .from("friendships")
            .update({status: "accepted"})
            .eq("user_id", userId)
            .eq("friend_id", user.id);

        if (!error) {
            setFriendshipStatus("accepted");
            if (onStatusChange) onStatusChange();

            await supabase.from("notifications").insert({
                user_id: userId,
                from_user_id: user.id,
                type: "friend_accept",
                title: "Friend Request Accepted",
                message: "accepted your friend request",
                link: `/profile/${user.id}`,
            });
        }
        setIsLoading(false);
    };

    const removeFriend = async () => {
        setIsLoading(true);
        const {
            data: {user},
        } = await supabase.auth.getUser();
        if (!user) {
            return;
        }

        await supabase
            .from("friendships")
            .delete()
            .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`);

        setFriendshipStatus("none");
        if (onStatusChange) onStatusChange();
        setIsLoading(false);
    };

    const cancelRequest = async () => {
        setIsLoading(true);
        const {
            data: {user},
        } = await supabase.auth.getUser();
        if (!user) {
            return;
        }

        await supabase.from("friendships").delete().eq("user_id", user.id).eq("friend_id", userId);

        setFriendshipStatus("none");
        if (onStatusChange) onStatusChange();
        setIsLoading(false);
    };

    if (friendshipStatus === "accepted") {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="border-royal-green text-royal-green hover:bg-royal-green hover:text-white bg-transparent"
                        disabled={isLoading}
                    >
                        <UserCheck className="h-4 w-4 mr-2"/>
                        Friends
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={toggleMute} className="cursor-pointer">
                        {isMuted ? (
                            <>
                                <Eye className="h-4 w-4 mr-2"/>
                                Unmute (Follow in Feed)
                            </>
                        ) : (
                            <>
                                <EyeOff className="h-4 w-4 mr-2"/>
                                Mute (Don't Follow)
                            </>
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={removeFriend} className="text-destructive cursor-pointer">
                        <UserX className="h-4 w-4 mr-2"/>
                        Unfriend
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    if (friendshipStatus === "pending") {
        return (
            <div className="flex gap-2">
                <Button
                    onClick={acceptFriendRequest}
                    className="bg-gradient-to-r from-royal-green to-emerald-600"
                    disabled={isLoading}
                >
                    <UserCheck className="h-4 w-4 mr-2"/>
                    Accept
                </Button>
                <Button variant="outline" onClick={removeFriend} disabled={isLoading}>
                    Decline
                </Button>
            </div>
        );
    }

    if (friendshipStatus === "sent") {
        return (
            <Button variant="outline" onClick={cancelRequest} disabled={isLoading}>
                <Clock className="h-4 w-4 mr-2"/>
                Request Sent
            </Button>
        );
    }

    return (
        <Button
            onClick={sendFriendRequest}
            className="bg-gradient-to-r from-royal-blue to-royal-purple"
            disabled={isLoading}
        >
            <UserPlus className="h-4 w-4 mr-2"/>
            Add Friend
        </Button>
    );
}
