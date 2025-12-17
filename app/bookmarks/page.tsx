import {Bookmark} from "lucide-react";
import {redirect} from "next/navigation";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {createServerClient} from "@/lib/supabase/server";

import {BookmarksClient} from "./bookmarks-client";

export default async function BookmarksPage() {
    const supabase = await createServerClient();
    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const {data: bookmarks} = await supabase
        .from("bookmarks")
        .select(`
      id,
      created_at,
      post_id,
      posts:post_id (
        id,
        content,
        created_at,
        content_rating,
        media_type,
        media_url,
        content_type,
        is_promotional,
        profiles(id, username, display_name, avatar_url)
      )
    `)
        .eq("user_id", user.id)
        .order("created_at", {ascending: false});

    const posts = bookmarks?.map((b) => b.posts).filter(Boolean) || [];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
                <Card className="mb-6 border-royal-purple/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gradient">
                            <Bookmark className="h-5 w-5"/>
                            Your Bookmarks
                        </CardTitle>
                    </CardHeader>
                </Card>

                {posts.length === 0 ? (
                    <Card className="border-royal-purple/20">
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                            <p>No bookmarks yet. Start bookmarking posts you want to save!</p>
                        </CardContent>
                    </Card>
                ) : (
                    <BookmarksClient posts={posts}/>
                )}
            </div>
        </div>
    );
}
