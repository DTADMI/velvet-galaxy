import {redirect} from "next/navigation";

import {Navigation} from "@/components/navigation";
import {ProfileClient} from "@/components/profile-client";
import {createClient} from "@/lib/supabase/server";

export default async function ProfilePage() {
    const supabase = await createClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/login");
    }

    const {data: profile} = await supabase
        .from("profiles")
        .select("username, display_name, bio, location, created_at, avatar_url, is_verified, account_type")
        .eq("id", user.id)
        .single();

    const {data: subscription} = await supabase
        .from("subscriptions")
        .select("tier, status, end_date")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

    const {data: posts, count: postsCount} = await supabase
        .from("posts")
        .select("id", {count: "exact"})
        .eq("author_id", user.id);

    const {data: listings, count: listingsCount} = await supabase
        .from("marketplace_items")
        .select("id", {count: "exact"})
        .eq("seller_id", user.id);

    const {data: conversations, count: conversationsCount} = await supabase
        .from("conversation_participants")
        .select("id", {count: "exact"})
        .eq("user_id", user.id);

    const {count: followersCount} = await supabase
        .from("follows")
        .select("id", {count: "exact"})
        .eq("following_id", user.id);

    const {count: followingCount} = await supabase
        .from("follows")
        .select("id", {count: "exact"})
        .eq("follower_id", user.id);

    const {count: friendsCount} = await supabase
        .from("friendships")
        .select("id", {count: "exact"})
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq("status", "accepted");

    if (!profile) {
        redirect("/auth/login");
    }

    const displayName = profile.display_name || profile.username;

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto max-w-4xl px-4">
                    <ProfileClient
                        profile={profile}
                        subscription={subscription}
                        postsCount={postsCount || 0}
                        listingsCount={listingsCount || 0}
                        conversationsCount={conversationsCount || 0}
                        followersCount={followersCount || 0}
                        followingCount={followingCount || 0}
                        friendsCount={friendsCount || 0}
                        userId={user.id}
                    />
                </div>
            </main>
        </>
    );
}
