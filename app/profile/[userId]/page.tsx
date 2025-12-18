import {formatDistanceToNow} from "date-fns";
import {Calendar, FileText, HelpCircle, ImageIcon, MapPin, MessageSquare, Music, Users, Video} from "lucide-react";
import Link from "next/link";
import {redirect} from "next/navigation";

import {AnonymousFAQ} from "@/components/anonymous-faq";
import {FollowButton} from "@/components/follow-button";
import {FriendButton} from "@/components/friend-button";
import {Navigation} from "@/components/navigation";
import {PostCard} from "@/components/post-card";
import {SendMessageButton} from "@/components/send-message-button";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {createClient} from "@/lib/supabase/server";

export default async function PublicProfilePage({
                                                    params,
                                                    searchParams,
                                                }: {
    params: Promise<{ userId: string }>;
    searchParams: Promise<{ tab?: string }>
}) {
    const supabase = await createClient();

    const {
        data: {user: currentUser},
    } = await supabase.auth.getUser();
    if (!currentUser) {
        redirect("/auth/login");
    }

    const {userId} = await params;
    const {tab} = await searchParams;

    // Redirect to own profile if viewing self
    if (userId === currentUser.id) {
        redirect("/profile");
    }

    const {data: profile} = await supabase
        .from("profiles")
        .select(
            "id, username, display_name, bio, location, avatar_url, created_at, message_privacy, dating_messages_enabled",
        )
        .eq("id", userId)
        .single();

    if (!profile) {
        redirect("/feed");
    }

    const {data: postsData} = await supabase
        .from("posts")
        .select(
            `
      id,
      content,
      created_at,
      content_rating,
      media_type,
      media_url,
      author_id,
      profiles:author_id (id, username, display_name, avatar_url)
    `,
        )
        .eq("author_id", userId)
        .order("created_at", {ascending: false})
        .limit(20);

    // Map the posts to ensure author_profile is a single object
    const posts = (postsData || []).map(post => ({
        ...post,
        author_profile: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
        profiles: undefined // Remove the profiles array to avoid confusion
    }));

    // Fetch user's media
    const {data: pictures} = await supabase
        .from("media_items")
        .select("id, title, media_url, thumbnail_url, created_at")
        .eq("user_id", userId)
        .eq("media_type", "picture")
        .order("created_at", {ascending: false})
        .limit(12);

    const {data: videos} = await supabase
        .from("media_items")
        .select("id, title, media_url, thumbnail_url, created_at")
        .eq("user_id", userId)
        .eq("media_type", "video")
        .order("created_at", {ascending: false})
        .limit(12);

    const {data: audios} = await supabase
        .from("media_items")
        .select("id, title, created_at")
        .eq("user_id", userId)
        .eq("media_type", "audio")
        .order("created_at", {ascending: false})
        .limit(12);

    const {data: writings} = await supabase
        .from("media_items")
        .select("id, title, content, created_at")
        .eq("user_id", userId)
        .eq("media_type", "writing")
        .order("created_at", {ascending: false})
        .limit(12);

    // Fetch user's groups
    const {data: userGroups} = await supabase
        .from("group_members")
        .select(
            `
      groups (
        id,
        name,
        description,
        image_url
      )
    `,
        )
        .eq("user_id", userId)
        .limit(10);

    // Fetch stats
    const {count: postsCount} = await supabase.from("posts").select("id", {count: "exact"}).eq("author_id", userId);

    const {count: followersCount} = await supabase
        .from("follows")
        .select("id", {count: "exact"})
        .eq("following_id", userId);

    const {count: followingCount} = await supabase
        .from("follows")
        .select("id", {count: "exact"})
        .eq("follower_id", userId);

    const displayName = profile.display_name || profile.username;

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto max-w-4xl px-4">
                    <div className="space-y-6">
                        <Card className="border-royal-purple/20 bg-gradient-to-br from-card to-card/50">
                            <CardHeader className="pb-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                    <Avatar className="h-24 w-24 border-4 border-royal-purple/20">
                                        <AvatarImage src={profile.avatar_url || undefined}/>
                                        <AvatarFallback
                                            className="bg-gradient-to-br from-royal-auburn via-royal-purple to-royal-blue text-white text-3xl">
                                            {displayName[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <h1 className="text-3xl font-bold text-gradient">{displayName}</h1>
                                            <Badge variant="outline" className="w-fit border-royal-purple/20">
                                                @{profile.username}
                                            </Badge>
                                        </div>
                                        {profile.bio &&
                                            <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>}
                                        <div
                                            className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                            {profile.location && (
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-4 w-4"/>
                                                    {profile.location}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4"/>
                                                Joined {formatDistanceToNow(new Date(profile.created_at), {addSuffix: true})}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                                        <SendMessageButton
                                            recipientId={userId}
                                            recipientName={displayName}
                                            recipientPrivacy={{
                                                message_privacy: profile.message_privacy || "everyone",
                                                dating_messages_enabled: profile.dating_messages_enabled ?? true,
                                            }}
                                        />
                                        <FriendButton userId={userId}/>
                                        <FollowButton userId={userId}/>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        <div className="grid grid-cols-3 gap-4">
                            <Card className="border-royal-blue/20 bg-card/50 hover:border-royal-blue/40 transition-all">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <div
                                            className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-royal-blue to-blue-600">
                                            <MessageSquare className="h-6 w-6 text-white"/>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">{postsCount || 0}</p>
                                            <p className="text-sm text-muted-foreground">Posts</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card
                                className="border-royal-purple/20 bg-card/50 hover:border-royal-purple/40 transition-all">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <div
                                            className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-royal-purple to-purple-600">
                                            <Users className="h-6 w-6 text-white"/>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">{followersCount || 0}</p>
                                            <p className="text-sm text-muted-foreground">Followers</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card
                                className="border-royal-auburn/20 bg-card/50 hover:border-royal-auburn/40 transition-all">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <div
                                            className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-royal-auburn to-red-600">
                                            <Users className="h-6 w-6 text-white"/>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">{followingCount || 0}</p>
                                            <p className="text-sm text-muted-foreground">Following</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Tabs defaultValue={tab || "posts"} className="w-full">
                            <TabsList className="grid grid-cols-7 bg-background/50">
                                <TabsTrigger value="posts">Posts</TabsTrigger>
                                <TabsTrigger value="pictures">
                                    <ImageIcon className="h-4 w-4"/>
                                </TabsTrigger>
                                <TabsTrigger value="videos">
                                    <Video className="h-4 w-4"/>
                                </TabsTrigger>
                                <TabsTrigger value="audios">
                                    <Music className="h-4 w-4"/>
                                </TabsTrigger>
                                <TabsTrigger value="writings">
                                    <FileText className="h-4 w-4"/>
                                </TabsTrigger>
                                <TabsTrigger value="groups">Groups</TabsTrigger>
                                <TabsTrigger value="faq">
                                    <HelpCircle className="h-4 w-4"/>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="posts" className="mt-6 space-y-4">
                                {posts && posts.length > 0 ? (
                                    posts.map((post) => <PostCard key={post.id} post={post}/>)
                                ) : (
                                    <Card className="border-royal-purple/20 bg-card/50">
                                        <CardContent className="py-12 text-center text-muted-foreground">
                                            <p>No posts yet</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            <TabsContent value="pictures" className="mt-6">
                                {pictures && pictures.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {pictures.map((picture) => (
                                            <Link key={picture.id} href={`/media/${picture.id}`}>
                                                <Card
                                                    className="overflow-hidden hover:border-royal-purple/40 transition-all cursor-pointer">
                                                    <div className="aspect-square bg-muted relative">
                                                        <img
                                                            src={picture.thumbnail_url || picture.media_url || "/placeholder.svg"}
                                                            alt={picture.title}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    </div>
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <Card className="border-royal-purple/20 bg-card/50">
                                        <CardContent className="py-12 text-center text-muted-foreground">
                                            <p>No pictures yet</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            <TabsContent value="videos" className="mt-6">
                                {videos && videos.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {videos.map((video) => (
                                            <Link key={video.id} href={`/media/${video.id}`}>
                                                <Card
                                                    className="overflow-hidden hover:border-royal-orange/40 transition-all cursor-pointer">
                                                    <div className="aspect-video bg-muted relative">
                                                        {video.thumbnail_url && (
                                                            <img
                                                                src={video.thumbnail_url || "/placeholder.svg"}
                                                                alt={video.title}
                                                                className="object-cover w-full h-full"
                                                            />
                                                        )}
                                                    </div>
                                                    <CardContent className="p-3">
                                                        <p className="text-sm font-medium line-clamp-1">{video.title}</p>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <Card className="border-royal-purple/20 bg-card/50">
                                        <CardContent className="py-12 text-center text-muted-foreground">
                                            <p>No videos yet</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            <TabsContent value="audios" className="mt-6">
                                {audios && audios.length > 0 ? (
                                    <div className="space-y-2">
                                        {audios.map((audio) => (
                                            <Link key={audio.id} href={`/media/${audio.id}`}>
                                                <Card
                                                    className="hover:border-royal-blue/40 transition-all cursor-pointer">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-royal-blue to-blue-600">
                                                                <Music className="h-5 w-5 text-white"/>
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-medium">{audio.title}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {formatDistanceToNow(new Date(audio.created_at), {addSuffix: true})}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <Card className="border-royal-purple/20 bg-card/50">
                                        <CardContent className="py-12 text-center text-muted-foreground">
                                            <p>No audio files yet</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            <TabsContent value="writings" className="mt-6">
                                {writings && writings.length > 0 ? (
                                    <div className="space-y-4">
                                        {writings.map((writing) => (
                                            <Link key={writing.id} href={`/media/${writing.id}`}>
                                                <Card
                                                    className="hover:border-royal-green/40 transition-all cursor-pointer">
                                                    <CardContent className="p-4">
                                                        <h3 className="font-semibold text-lg mb-2">{writing.title}</h3>
                                                        <p className="text-sm text-muted-foreground line-clamp-3">{writing.content}</p>
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            {formatDistanceToNow(new Date(writing.created_at), {addSuffix: true})}
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <Card className="border-royal-purple/20 bg-card/50">
                                        <CardContent className="py-12 text-center text-muted-foreground">
                                            <p>No writings yet</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            <TabsContent value="groups" className="mt-6">
                                {userGroups && userGroups.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {userGroups.map((item: any) => (
                                            <Card key={item.groups.id}
                                                  className="hover:border-royal-green/40 transition-all">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start gap-3">
                                                        <div
                                                            className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-royal-green to-emerald-600 flex-shrink-0">
                                                            <Users className="h-6 w-6 text-white"/>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold truncate">{item.groups.name}</h3>
                                                            <p className="text-sm text-muted-foreground line-clamp-2">{item.groups.description}</p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <Card className="border-royal-purple/20 bg-card/50">
                                        <CardContent className="py-12 text-center text-muted-foreground">
                                            <p>Not a member of any groups yet</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            <TabsContent value="faq" className="mt-6">
                                <AnonymousFAQ profileId={userId} isOwnProfile={false}/>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>
        </>
    );
}
