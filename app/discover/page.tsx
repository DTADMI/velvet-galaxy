import {redirect} from "next/navigation";

import {Navigation} from "@/components/navigation";
import {createClient} from "@/lib/supabase/server";

import {DiscoverClient} from "./discover-client";

export default async function DiscoverPage() {
    const supabase = await createClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/login");
    }

    const {data: profile} = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, location")
        .eq("id", user.id)
        .single();

    // Get user's liked tags for curated feed
    const {data: likedTags} = await supabase
        .from("user_tag_preferences")
        .select("tag_id, tags!inner(name)")
        .eq("user_id", user.id)
        .limit(10);

    // Transform the data to match the expected structure
    const transformedLikedTags = (likedTags || []).map(tag => ({
        tag_id: tag.tag_id,
        tags: Array.isArray(tag.tags) ? tag.tags[0] : tag.tags
    }));

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto max-w-[1800px] px-4">
                    {profile && <DiscoverClient profile={profile} _likedTags={transformedLikedTags}/>}
                </div>
            </main>
        </>
    );
}
