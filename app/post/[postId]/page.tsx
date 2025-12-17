import {redirect} from "next/navigation";

import {Navigation} from "@/components/navigation";
import {createServerClient} from "@/lib/supabase/server";

import {PostDetailView} from "./post-detail-view";

export default async function PostDetailPage({
                                                 params,
                                             }: {
    params: Promise<{ postId: string }>
}) {
    const {postId} = await params;
    const supabase = await createServerClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const {data: post} = await supabase
        .from("posts")
        .select(`
      *,
      profiles(id, username, display_name, avatar_url),
      post_likes(user_id)
    `)
        .eq("id", postId)
        .single();

    if (!post) {
        redirect("/feed");
    }

    return (
        <>
            <Navigation/>
            <PostDetailView post={post} currentUserId={user.id}/>
        </>
    );
}
