import {notFound, redirect} from "next/navigation";

import {Navigation} from "@/components/navigation";
import {createClient} from "@/lib/supabase/server";

import {MediaViewerPage} from "./media-viewer-page";

export default async function MediaPage({params}: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const {id} = await params;

    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const {data: mediaItem} = await supabase
        .from("media_items")
        .select(
            `
      *,
      profiles:user_id(id, username, display_name, avatar_url, is_verified)
    `,
        )
        .eq("id", id)
        .single();

    if (!mediaItem) {
        notFound();
    }

    const {data: userMedia} = await supabase
        .from("media_items")
        .select("id, media_url, media_type, title, created_at")
        .eq("user_id", mediaItem.user_id)
        .eq("media_type", mediaItem.media_type)
        .order("created_at", {ascending: false})
        .limit(50);

    const currentIndex = userMedia?.findIndex((m) => m.id === id) ?? -1;
    const previousMedia = currentIndex > 0 ? userMedia?.[currentIndex - 1] : null;
    const nextMedia = currentIndex < (userMedia?.length ?? 0) - 1 ? userMedia?.[currentIndex + 1] : null;

    return (
        <>
            <Navigation/>
            <MediaViewerPage
                mediaItem={mediaItem}
                userMedia={userMedia || []}
                currentMediaId={id}
                currentUserId={user.id}
                previousMedia={previousMedia}
                nextMedia={nextMedia}
                currentIndex={currentIndex}
                totalMediaCount={userMedia?.length || 0}
            />
        </>
    );
}
