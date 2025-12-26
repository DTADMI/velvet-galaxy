"use server";

import {createClient} from "@/lib/supabase/server";
import {revalidatePath} from "next/cache";

export type FriendshipAction =
    | 'send-request'
    | 'accept-request'
    | 'remove-friend'
    | 'cancel-request'
    | 'toggle-mute';

export async function handleFriendship(userId: string, action: FriendshipAction, data?: { isMuted?: boolean }) {
    const supabase = await createClient();

    const {data: {user}, error: authError} = await supabase.auth.getUser();
    if (authError || !user) {
        return {success: false, error: 'Not authenticated'};
    }

    try {
        switch (action) {
            case 'send-request':
                const {error: sendError} = await supabase
                    .from('friendships')
                    .insert([{
                        user_id: user.id,
                        friend_id: userId,
                        status: 'pending'
                    }]);
                if (sendError) throw sendError;
                break;

            case 'accept-request':
                // Update the existing friend request to accepted
                const {error: acceptError} = await supabase
                    .from('friendships')
                    .update({status: 'accepted'})
                    .eq('user_id', userId)
                    .eq('friend_id', user.id)
                    .eq('status', 'pending');

                if (acceptError) throw acceptError;
                break;

            case 'remove-friend':
                // Delete friendship in both directions
                const {error: removeError} = await supabase
                    .from('friendships')
                    .delete()
                    .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`);

                if (removeError) throw removeError;
                break;

            case 'cancel-request':
                // Delete the pending request
                const {error: cancelError} = await supabase
                    .from('friendships')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('friend_id', userId)
                    .eq('status', 'pending');

                if (cancelError) throw cancelError;
                break;

            case 'toggle-mute':
                const {isMuted} = data || {isMuted: false};
                const {error: muteError} = await supabase
                    .from('friendships')
                    .update({is_muted: !isMuted})
                    .eq("user_id", user.id)
                    .eq("friend_id", userId);
                if (muteError) throw muteError;
                break;
        }

        revalidatePath(`/profile/${userId}`);
        return {success: true};
    } catch (error) {
        console.error('Error in friendship action:', error);
        return {
            success: false,
            error: `Failed to ${action.replace('-', ' ')}`
        };
    }
}