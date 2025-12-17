import {redirect} from "next/navigation";

import {checkSubscriptionStatus} from "@/app/actions/stripe";
import {Navigation} from "@/components/navigation";
import {createClient} from "@/lib/supabase/server";

import {FeedClient} from "./feed-client";

export default async function FeedPage() {
    const supabase = await createClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/login");
    }

    const {isPremium} = await checkSubscriptionStatus();

    const {data: profile} = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .eq("id", user.id)
        .single();

    const {data: posts} = await supabase
        .from("posts")
        .select(
            `
      id,
      content,
      created_at,
      content_rating,
      media_type,
      media_url,
      images,
      audio_url,
      is_promotional,
      visibility,
      profiles (
        id,
        username,
        display_name,
        avatar_url
      )
    `,
        )
        .order("created_at", {ascending: false})
        .limit(20);

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto max-w-[1600px] px-4">
                    {profile && <FeedClient profile={profile} initialPosts={posts || []} isPremium={isPremium}/>}
                </div>
            </main>
        </>
    );
}
