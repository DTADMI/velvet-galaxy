"use client";

import {Clock, Eye, EyeOff, UserCheck, UserPlus, UserX} from "lucide-react";
import {useCallback, useEffect, useState} from "react";
import {toast} from "sonner";

import {Button} from "@/components/ui/button";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {createBrowserClient} from "@/lib/supabase/client";
import {FriendshipAction} from "@/app/actions/friendship";

type FriendshipRequestStatus = "none" | "sent" | "pending" | "accepted";

interface FriendButtonProps {
    userId: string;
    action: (userId: string, action: FriendshipAction, data?: { isMuted?: boolean }) => Promise<{
        success: boolean;
        error?: string
    }>
}

export function FriendButton({userId, action}: FriendButtonProps) {
    const [friendshipRequestStatus, setFriendshipRequestStatus] = useState<FriendshipRequestStatus>("none");
    const [isMuted, setIsMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createBrowserClient();

    const checkFriendshipStatus = useCallback(async () => {
        const {
            data: {user},
        } = await supabase.auth.getUser();
        if (!user) {
            setIsLoading(false);
            return;
        }

        try {
            // Check sent and received requests
            const {data} = await supabase
                .from('friendships')
                .select('user_id, status, is_muted')
                .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`)
                .maybeSingle();

            if (!data) {
                setFriendshipRequestStatus("none");
            } else if (data.status === 'accepted') {
                setFriendshipRequestStatus("accepted");
                setIsMuted(data.is_muted || false);
            } else if (data.user_id === user.id) {
                setFriendshipRequestStatus("sent");
            } else {
                setFriendshipRequestStatus("pending");
            }
        } catch (err) {
            console.error("Error checking friendship status:", err);
            setError("Failed to load friendship status");
        } finally {
            setIsLoading(false);
        }
    }, [userId, supabase]);

    useEffect(() => {
        checkFriendshipStatus();
    }, [userId]);

    const toggleMute = async () => {
        setIsLoading(true);
        try {
            const result = await action(userId, 'toggle-mute', {isMuted});
            if (result.success) {
                setIsMuted(!isMuted);
                toast.success(`Friend ${!isMuted ? 'muted' : 'unmuted'} successfully`);
            } else {
                setError(result.error || 'Failed to update mute status');
            }
        } catch (err) {
            console.error('Error toggling mute:', err);
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (actionType: FriendshipAction) => {
        setIsLoading(true);
        try {
            const result = await action(userId, actionType);
            if (result.success) {
                await checkFriendshipStatus();
            } else {
                setError(result.error || 'Action failed');
            }
        } catch (err) {
            console.error('Error performing action:', err);
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (error) {
        return (
            <div className="text-sm text-red-500">
                {error}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError(null)}
                    className="ml-2"
                >
                    Retry
                </Button>
            </div>
        );
    }

    if (isLoading) {
        return <Button variant="outline" size="sm" disabled>Loading...</Button>;
    }

    if (friendshipRequestStatus === "accepted") {
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
                    <DropdownMenuItem onClick={() => handleAction('remove-friend')}
                                      className="text-destructive cursor-pointer">
                        <UserX className="h-4 w-4 mr-2"/>
                        Unfriend
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    if (friendshipRequestStatus === "pending") {
        return (
            <div className="flex gap-2">
                <Button
                    onClick={() => handleAction("accept-request")}
                    className="bg-gradient-to-r from-royal-green to-emerald-600"
                    disabled={isLoading}
                >
                    <UserCheck className="h-4 w-4 mr-2"/>
                    Accept
                </Button>
                <Button variant="outline" onClick={() => handleAction("remove-friend")} disabled={isLoading}>
                    Decline
                </Button>
            </div>
        );
    }

    if (friendshipRequestStatus === "sent") {
        return (
            <Button variant="outline" onClick={() => handleAction("cancel-request")} disabled={isLoading}>
                <Clock className="h-4 w-4 mr-2"/>
                Request Sent
            </Button>
        );
    }

    return (
        <Button
            onClick={() => handleAction("send-request")}
            className="bg-gradient-to-r from-royal-blue to-royal-purple"
            disabled={isLoading}
        >
            <UserPlus className="h-4 w-4 mr-2"/>
            Add Friend
        </Button>
    );
}
