import {redirect} from "next/navigation";

import {createClient} from "@/lib/supabase/server";

import {EditPostForm} from "./edit-post-form";

export default async function EditPostPage({params}: { params: Promise<{ postId: string }> }) {
    const {postId} = await params;
    const supabase = await createClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const {data: post, error} = await supabase.from("posts").select("*, profiles(*)").eq("id", postId).single();

    if (error || !post) {
        redirect("/feed");
    }

    if (post.author_id !== user.id) {
        redirect("/feed");
    }

    const postTime = new Date(post.created_at).getTime();
    const now = Date.now();
    const tenMinutesInMs = 10 * 60 * 1000;
    const isWithinEditWindow = now - postTime <= tenMinutesInMs;

    if (!isWithinEditWindow) {
        redirect(`/post/${postId}`);
    }

    return <EditPostForm post={post}/>;
}
