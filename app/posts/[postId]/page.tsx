import {redirect} from "next/navigation";

import {Navigation} from "@/components/navigation";
import {createClient} from "@/lib/supabase/server";

import {PostDetailView} from "./post-detail-view";

export async function generateMetadata({params}: { params: Promise<{ postId: string }> }) {
    const {postId} = await params;
    const supabase = await createClient();
    const {data} = await supabase.from("posts").select("*").eq("id", postId).single();
    const title = data?.title ?? "Post";
    const description = "Read this post on Velvet Galaxy.";
    return {
        title,
        description,
        alternates: {canonical: `/posts/${postId}`},
        openGraph: {title, description, url: `/posts/${postId}`},
    };
}

export default async function PostDetailPage({params}: { params: Promise<{ postId: string }> }) {
    const supabase = await createClient();
    const {postId} = await params;

    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const {data: post} = await supabase
        .from("posts")
        .select(
            `
      *,
      profiles (
        id,
        username,
        display_name,
        avatar_url
      )
    `,
        )
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
