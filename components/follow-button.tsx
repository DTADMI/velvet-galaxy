"use client";

import {UserMinus, UserPlus} from "lucide-react";
import {useCallback, useEffect, useState} from "react";

import {Button} from "@/components/ui/button";
import {createBrowserClient} from "@/lib/supabase/client";

export function FollowButton({userId, onStatusChange}: { userId: string; onStatusChange?: () => void }) {
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(false);
    const supabase = createBrowserClient();

    const checkFollowStatus = useCallback(async () => {
        const {
            data: {user},
        } = await supabase.auth.getUser();
        if (!user) {
            return;
        }

        const {data} = await supabase
            .from("follows")
            .select("id")
            .eq("follower_id", user.id)
            .eq("following_id", userId)
            .maybeSingle();

        setIsFollowing(!!data);
    }, [supabase, userId]);

    useEffect(() => {
        checkFollowStatus();
    }, [checkFollowStatus]);

    const handleFollow = async () => {
        setLoading(true);
        const {
            data: {user},
        } = await supabase.auth.getUser();
        if (!user) {
            return;
        }

        if (isFollowing) {
            await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId);
        } else {
            await supabase.from("follows").insert({follower_id: user.id, following_id: userId});
        }

        setIsFollowing(!isFollowing);
        if (onStatusChange) onStatusChange();
        setLoading(false);
    };

    return (
        <Button
            onClick={handleFollow}
            disabled={loading}
            className={
                isFollowing
                    ? "bg-card border border-royal-purple/20 hover:bg-card/80"
                    : "bg-gradient-to-r from-royal-blue to-royal-purple hover:opacity-90"
            }
        >
            {isFollowing ? (
                <>
                    <UserMinus className="h-4 w-4 mr-2"/>
                    Unfollow
                </>
            ) : (
                <>
                    <UserPlus className="h-4 w-4 mr-2"/>
                    Follow
                </>
            )}
        </Button>
    );
}
