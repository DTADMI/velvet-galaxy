"use client";

import {UserCheck, Users} from "lucide-react";
import Link from "next/link";
import {useEffect, useState} from "react";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Card} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {createBrowserClient} from "@/lib/supabase/client";

interface Profile {
    id: string
    username: string
    display_name: string
    avatar_url?: string
    bio?: string
}

export function FollowersList({userId, type}: { userId: string; type?: "friends" | "followers" | "following" }) {
    const [followers, setFollowers] = useState<Profile[]>([]);
    const [following, setFollowing] = useState<Profile[]>([]);
    const [friends, setFriends] = useState<Profile[]>([]);
    const supabase = createBrowserClient();

    useEffect(() => {
        loadFollowers();
        loadFollowing();
        loadFriends();
    }, [userId]);

    const loadFollowers = async () => {
        const {data} = await supabase
            .from("follows")
            .select("follower_id, profiles!follows_follower_id_fkey(*)")
            .eq("following_id", userId);

        if (data) {
            setFollowers(data.map((f: any) => f.profiles));
        }
    };

    const loadFollowing = async () => {
        const {data} = await supabase
            .from("follows")
            .select("following_id, profiles!follows_following_id_fkey(*)")
            .eq("follower_id", userId);

        if (data) {
            setFollowing(data.map((f: any) => f.profiles));
        }
    };

    const loadFriends = async () => {
        const {data: friendships1} = await supabase
            .from("friendships")
            .select("friend_id, profiles!friendships_friend_id_fkey(*)")
            .eq("user_id", userId)
            .eq("status", "accepted");

        const {data: friendships2} = await supabase
            .from("friendships")
            .select("user_id, profiles!friendships_user_id_fkey(*)")
            .eq("friend_id", userId)
            .eq("status", "accepted");

        const allFriends = [
            ...(friendships1?.map((f: any) => f.profiles) || []),
            ...(friendships2?.map((f: any) => f.profiles) || []),
        ];

        setFriends(allFriends);
    };

    const ProfileCard = ({profile}: { profile: Profile }) => (
        <Link href={`/profile/${profile.id}`}>
            <Card className="p-4 hover:border-royal-purple/40 transition-all bg-card/50 border-royal-purple/20">
                <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-royal-purple/20">
                        <AvatarImage src={profile.avatar_url || "/placeholder.svg"}/>
                        <AvatarFallback className="bg-gradient-to-br from-royal-blue to-royal-purple text-white">
                            {profile.display_name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold">{profile.display_name}</p>
                        <p className="text-sm text-muted-foreground">@{profile.username}</p>
                        {profile.bio &&
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{profile.bio}</p>}
                    </div>
                </div>
            </Card>
        </Link>
    );

    return (
        <Tabs defaultValue={type || "friends"} className="w-full">
            <TabsList className="grid grid-cols-3 bg-background/50">
                <TabsTrigger value="friends">
                    <UserCheck className="h-4 w-4 mr-2"/>
                    Friends ({friends.length})
                </TabsTrigger>
                <TabsTrigger value="followers">
                    <Users className="h-4 w-4 mr-2"/>
                    Followers ({followers.length})
                </TabsTrigger>
                <TabsTrigger value="following">
                    <Users className="h-4 w-4 mr-2"/>
                    Following ({following.length})
                </TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="space-y-3 mt-4">
                {friends.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <UserCheck className="h-12 w-12 mx-auto mb-2 opacity-50"/>
                        <p>No friends yet</p>
                    </div>
                ) : (
                    friends.map((profile) => <ProfileCard key={profile.id} profile={profile}/>)
                )}
            </TabsContent>

            <TabsContent value="followers" className="space-y-3 mt-4">
                {followers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50"/>
                        <p>No followers yet</p>
                    </div>
                ) : (
                    followers.map((profile) => <ProfileCard key={profile.id} profile={profile}/>)
                )}
            </TabsContent>

            <TabsContent value="following" className="space-y-3 mt-4">
                {following.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50"/>
                        <p>Not following anyone yet</p>
                    </div>
                ) : (
                    following.map((profile) => <ProfileCard key={profile.id} profile={profile}/>)
                )}
            </TabsContent>
        </Tabs>
    );
}
