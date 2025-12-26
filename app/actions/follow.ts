"use server";

import {createClient} from "@/lib/supabase/server";
import {revalidatePath} from "next/cache";

export async function toggleFollow(userId: string, isFollowing: boolean) {
    const supabase = await createClient();

    // Get current user
    const {data: {user}, error: authError} = await supabase.auth.getUser();
    if (authError || !user) {
        return {success: false, error: 'Not authenticated'};
    }

    try {
        if (isFollowing) {
            // Unfollow
            const {error} = await supabase
                .from('follows')
                .delete()
                .eq('follower_id', user.id)
                .eq('following_id', userId);

            if (error) throw error;
        } else {
            // Follow
            const {error} = await supabase
                .from('follows')
                .insert([
                    {follower_id: user.id, following_id: userId}
                ]);

            if (error) throw error;
        }

        // Revalidate the profile page
        revalidatePath(`/profile/${userId}`);
        return {success: true};
    } catch (error) {
        console.error('Error toggling follow:', error);
        return {success: false, error: 'Failed to update follow status'};
    }
}
