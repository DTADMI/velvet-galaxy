import {notFound, redirect} from "next/navigation";

import {MediaGallery} from "@/components/media-gallery";
import {Navigation} from "@/components/navigation";
import {createClient} from "@/lib/supabase/server";

export default async function GalleryPage({params}: { params: Promise<{ userId: string }> }) {
    const {userId} = await params;
    const supabase = await createClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const isOwnProfile = user?.id === userId;

    const {data: profile} = await supabase.from("profiles").select("*").eq("id", userId).single();

    if (!profile) {
        notFound();
    }

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gradient mb-2">
                            {isOwnProfile ? "My Media" : `${profile.display_name}'s Media`}
                        </h1>
                        <p className="text-muted-foreground">Browse and manage media collections</p>
                    </div>

                    <MediaGallery userId={userId} isOwnProfile={isOwnProfile}/>
                </div>
            </main>
        </>
    );
}
