"use client";

import {formatDistanceToNow} from "date-fns";
import {
    Calendar,
    CalendarDays,
    Crown,
    FileText,
    Heart,
    HelpCircle,
    ImageIcon,
    MapPin,
    MessageSquare,
    Music,
    Package,
    Shield,
    UserCheck,
    Users,
    UsersRound,
    Video,
} from "lucide-react";
import Link from "next/link";
import {useState} from "react";

import {ActivityFeed} from "@/components/activity-feed";
import {AnonymousFAQ} from "@/components/anonymous-faq";
import {EditProfileDialog} from "@/components/edit-profile-dialog";
import {FollowersList} from "@/components/followers-list";
import {ProfileEvents} from "@/components/profile-events";
import {ProfileGallery} from "@/components/profile-gallery";
import {ProfileGroups} from "@/components/profile-groups";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";

interface ProfileClientProps {
    profile: any
    subscription: any
    postsCount: number
    listingsCount: number
    conversationsCount: number
    followersCount: number
    followingCount: number
    friendsCount: number
    userId: string
}

export function ProfileClient({
                                  profile,
                                  subscription,
                                  postsCount,
                                  listingsCount,
                                  conversationsCount,
                                  followersCount,
                                  followingCount,
                                  friendsCount,
                                  userId,
                              }: ProfileClientProps) {
    const [activeTab, setActiveTab] = useState("activity");
    const displayName = profile.display_name || profile.username;

    return (
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
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="w-fit border-royal-purple/20">
                                        @{profile.username}
                                    </Badge>
                                    {profile.is_verified && (
                                        <Badge className="bg-gradient-to-r from-royal-blue to-royal-purple">
                                            <Shield className="h-3 w-3 mr-1"/>
                                            Verified
                                        </Badge>
                                    )}
                                    {subscription && (
                                        <Badge className="bg-gradient-to-r from-royal-auburn to-royal-orange">
                                            <Crown className="h-3 w-3 mr-1"/>
                                            {subscription.tier}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            {profile.bio && <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                {profile.location && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4"/>
                                        {profile.location}
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4"/>
                                    Joined{" "}
                                    {formatDistanceToNow(new Date(profile.created_at), {
                                        addSuffix: true,
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <EditProfileDialog profile={profile}/>
                            {!subscription && (
                                <Button asChild size="sm"
                                        className="bg-gradient-to-r from-royal-auburn to-royal-orange">
                                    <Link href="/subscribe">
                                        <Heart className="h-4 w-4 mr-2"/>
                                        Support Us
                                    </Link>
                                </Button>
                            )}
                            {!profile.is_verified && (
                                <Button asChild variant="outline" size="sm">
                                    <Link href="/verify">
                                        <Shield className="h-4 w-4 mr-2"/>
                                        Get Verified
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="border-royal-blue/20 bg-card/50 hover:border-royal-blue/40 transition-all">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center gap-2">
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-royal-blue to-blue-600">
                                <MessageSquare className="h-6 w-6 text-white"/>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{postsCount}</p>
                                <p className="text-sm text-muted-foreground">Posts</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-royal-green/20 bg-card/50 hover:border-royal-green/40 transition-all">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center gap-2">
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-royal-green to-emerald-600">
                                <Package className="h-6 w-6 text-white"/>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{listingsCount}</p>
                                <p className="text-sm text-muted-foreground">Listings</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-royal-orange/20 bg-card/50 hover:border-royal-orange/40 transition-all">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center gap-2">
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-royal-orange to-amber-600">
                                <MessageSquare className="h-6 w-6 text-white"/>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{conversationsCount}</p>
                                <p className="text-sm text-muted-foreground">Chats</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="border-royal-pink/20 bg-card/50 hover:border-royal-pink/40 transition-all cursor-pointer"
                    onClick={() => {
                        setActiveTab("friends");
                        setTimeout(() => {
                            const friendsTab = document.querySelector('[value="friends"]');
                            friendsTab?.scrollIntoView({behavior: "smooth"});
                        }, 100);
                    }}
                >
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center gap-2">
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-600">
                                <UserCheck className="h-6 w-6 text-white"/>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{friendsCount}</p>
                                <p className="text-sm text-muted-foreground">Friends</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="border-royal-purple/20 bg-card/50 hover:border-royal-purple/40 transition-all cursor-pointer"
                    onClick={() => {
                        setActiveTab("followers");
                        setTimeout(() => {
                            const followersTab = document.querySelector('[value="followers"]');
                            followersTab?.scrollIntoView({behavior: "smooth"});
                        }, 100);
                    }}
                >
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center gap-2">
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-royal-purple to-purple-600">
                                <Users className="h-6 w-6 text-white"/>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{followersCount}</p>
                                <p className="text-sm text-muted-foreground">Followers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="border-royal-auburn/20 bg-card/50 hover:border-royal-auburn/40 transition-all cursor-pointer"
                    onClick={() => {
                        setActiveTab("following");
                        setTimeout(() => {
                            const followingTab = document.querySelector('[value="following"]');
                            followingTab?.scrollIntoView({behavior: "smooth"});
                        }, 100);
                    }}
                >
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center gap-2">
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-royal-auburn to-red-600">
                                <Users className="h-6 w-6 text-white"/>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{followingCount}</p>
                                <p className="text-sm text-muted-foreground">Following</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-9 bg-background/50">
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="pictures">
                        <ImageIcon className="h-4 w-4 mr-2"/>
                        Pictures
                    </TabsTrigger>
                    <TabsTrigger value="videos">
                        <Video className="h-4 w-4 mr-2"/>
                        Videos
                    </TabsTrigger>
                    <TabsTrigger value="audios">
                        <Music className="h-4 w-4 mr-2"/>
                        Audios
                    </TabsTrigger>
                    <TabsTrigger value="writings">
                        <FileText className="h-4 w-4 mr-2"/>
                        Writings
                    </TabsTrigger>
                    <TabsTrigger value="groups">
                        <UsersRound className="h-4 w-4 mr-2"/>
                        Groups
                    </TabsTrigger>
                    <TabsTrigger value="events">
                        <CalendarDays className="h-4 w-4 mr-2"/>
                        Events
                    </TabsTrigger>
                    <TabsTrigger value="followers">Followers</TabsTrigger>
                    <TabsTrigger value="faq">
                        <HelpCircle className="h-4 w-4 mr-2"/>
                        Q&A
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="activity" className="mt-6">
                    <Card className="border-royal-purple/20 bg-card/50">
                        <CardHeader>
                            <h2 className="text-xl font-semibold text-gradient">Recent Activity</h2>
                        </CardHeader>
                        <CardContent>
                            <ActivityFeed userId={userId} mode="profile"/>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pictures" className="mt-6">
                    <ProfileGallery userId={userId} mediaType="picture"/>
                </TabsContent>

                <TabsContent value="videos" className="mt-6">
                    <ProfileGallery userId={userId} mediaType="video"/>
                </TabsContent>

                <TabsContent value="audios" className="mt-6">
                    <ProfileGallery userId={userId} mediaType="audio"/>
                </TabsContent>

                <TabsContent value="writings" className="mt-6">
                    <ProfileGallery userId={userId} mediaType="writing"/>
                </TabsContent>

                <TabsContent value="groups" className="mt-6">
                    <ProfileGroups userId={userId}/>
                </TabsContent>

                <TabsContent value="events" className="mt-6">
                    <ProfileEvents userId={userId}/>
                </TabsContent>

                <TabsContent value="followers" className="mt-6">
                    <FollowersList userId={userId} type="followers"/>
                </TabsContent>

                <TabsContent value="following" className="mt-6">
                    <FollowersList userId={userId} type="following"/>
                </TabsContent>

                <TabsContent value="faq" className="mt-6">
                    <AnonymousFAQ profileId={userId} isOwnProfile={true}/>
                </TabsContent>
            </Tabs>
        </div>
    );
}
