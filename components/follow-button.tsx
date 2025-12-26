"use client";

import {UserMinus, UserPlus} from "lucide-react";
import {useCallback, useEffect, useState, useTransition} from "react";

import {Button} from "@/components/ui/button";
import {createBrowserClient} from "@/lib/supabase/client";

type FollowButtonProps = {
    userId: string;
    action: (userId: string, isFollowing: boolean) => Promise<{ success: boolean; error?: string }>;
};

export function FollowButton({userId, action}: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createBrowserClient();

    const checkFollowStatus = useCallback(async () => {
        const {data: {user}} = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            const {data} = await supabase
                .from("follows")
                .select("id")
                .eq("follower_id", user.id)
                .eq("following_id", userId)
                .maybeSingle();

            setIsFollowing(!!data);
        } catch (err) {
            console.error("Error checking follow status:", err);
            setError("Failed to load follow status");
        } finally {
            setLoading(false);
        }
    }, [supabase, userId]);

    useEffect(() => {
        checkFollowStatus();
    }, [checkFollowStatus]);

    const handleFollow = async () => {
        startTransition(async () => {
            try {
                const result = await action(userId, isFollowing);

                if (result.success) {
                    const newFollowingState = !isFollowing;
                    setIsFollowing(newFollowingState);
        } else {
                    setError(result.error || 'Failed to update follow status');
        }
            } catch (err) {
                console.error('Error in follow action:', err);
                setError('An unexpected error occurred');
            }
        });
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

    return (
        <Button
            variant={isFollowing ? "outline" : "default"}
            size="sm"
            onClick={handleFollow}
            disabled={loading || isPending}
            className="w-24 min-w-[96px]"
        >
            {loading || isPending ? (
                <span className="loading loading-spinner loading-sm"/>
            ) : isFollowing ? (
                <UserMinus className="mr-2 h-4 w-4"/>
            ) : (
                <UserPlus className="mr-2 h-4 w-4"/>
            )}
            {isFollowing ? "Unfollow" : "Follow"}
        </Button>
    );
}
