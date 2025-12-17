"use client";

import {Calendar, Edit, Globe, Lock, Trash2, Users} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";

import {EnhancedCreatePost} from "@/components/enhanced-create-post";
import {FeedViewSettings, type PostDisplaySize} from "@/components/feed-view-settings";
import {Navigation} from "@/components/navigation";
import {PostCard} from "@/components/post-card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Textarea} from "@/components/ui/textarea";
import {createBrowserClient} from "@/lib/supabase/client";

interface GroupDetailViewProps {
    group: any
    userId: string
}

export function GroupDetailView({group, userId}: GroupDetailViewProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isMember, setIsMember] = useState(false);
    const [memberCount, setMemberCount] = useState(0);
    const [members, setMembers] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [isCreator, setIsCreator] = useState(false);
    const [editGroupOpen, setEditGroupOpen] = useState(false);
    const [groupSettings, setGroupSettings] = useState({
        name: group.name,
        description: group.description || "",
        is_private: group.is_private,
    });
    const [displaySize, setDisplaySize] = useState<PostDisplaySize>("normal");

    useEffect(() => {
        checkMembership();
        loadMembers();
        loadPosts();
        loadEvents();
        loadUserProfile();
        setIsCreator(group.creator_id === userId);
        // Load saved display size
        const savedSize = localStorage.getItem("feedDisplaySize") as PostDisplaySize;
        if (savedSize) {
            setDisplaySize(savedSize);
        }
    }, [checkMembership, group.creator_id, loadEvents, loadMembers, loadPosts, loadUserProfile, userId]);

    const handleDisplaySizeChange = (size: PostDisplaySize) => {
        setDisplaySize(size);
        localStorage.setItem("feedDisplaySize", size);
    };

    const loadUserProfile = async () => {
        const {data} = await supabase.from("profiles").select("*").eq("id", userId).single();
        if (data) {
            setUserProfile(data);
        }
    };

    const checkMembership = async () => {
        const {data} = await supabase
            .from("group_members")
            .select("id")
            .eq("group_id", group.id)
            .eq("user_id", userId)
            .single();

        setIsMember(!!data);
    };

    const loadMembers = async () => {
        const {data, count} = await supabase
            .from("group_members")
            .select("*, profiles(id, display_name, username, avatar_url)", {count: "exact"})
            .eq("group_id", group.id);

        if (data) {
            setMembers(data);
        }
        if (count) {
            setMemberCount(count);
        }
    };

    const loadPosts = async () => {
        const {data} = await supabase
            .from("posts")
            .select("*, profiles(id, username, display_name, avatar_url)")
            .eq("group_id", group.id)
            .order("created_at", {ascending: false});

        if (data) {
            setPosts(data);
        }
    };

    const loadEvents = async () => {
        const {data} = await supabase
            .from("events")
            .select("*")
            .eq("group_id", group.id)
            .order("start_date", {ascending: true});

        if (data) {
            setEvents(data);
        }
    };

    const handleJoinLeave = async () => {
        if (isMember) {
            await supabase.from("group_members").delete().eq("group_id", group.id).eq("user_id", userId);
        } else {
            await supabase.from("group_members").insert({group_id: group.id, user_id: userId});
        }
        setIsMember(!isMember);
        loadMembers();
    };

    const handleDeleteGroup = async () => {
        if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
            return;
        }

        try {
            await supabase.from("group_members").delete().eq("group_id", group.id);
            await supabase.from("posts").delete().eq("group_id", group.id);
            await supabase.from("events").delete().eq("group_id", group.id);
            await supabase.from("groups").delete().eq("id", group.id);

            router.push("/groups");
        } catch (error) {
            console.error("[v0] Error deleting group:", error);
            alert("Failed to delete group");
        }
    };

    const handleUpdateGroup = async () => {
        try {
            const {error} = await supabase
                .from("groups")
                .update({
                    name: groupSettings.name,
                    description: groupSettings.description,
                    is_private: groupSettings.is_private,
                })
                .eq("id", group.id);

            if (error) {
                throw error;
            }

            alert("Group updated successfully");
            setEditGroupOpen(false);
            router.refresh();
        } catch (error) {
            console.error("[v0] Error updating group:", error);
            alert("Failed to update group");
        }
    };

    return (
        <>
            <Navigation/>
            <div className="min-h-screen bg-background pt-20">
                <div className="max-w-6xl mx-auto p-6">
                    <div className="bg-card rounded-xl border border-royal-green/20 overflow-hidden mb-6">
                        <div
                            className="h-48 bg-gradient-to-br from-royal-green to-emerald-600 flex items-center justify-center relative">
                            {group.image_url ? (
                                <img
                                    src={group.image_url || "/placeholder.svg"}
                                    alt={group.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Users className="h-24 w-24 text-white"/>
                            )}
                        </div>

                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-3xl font-bold text-gradient">{group.name}</h1>
                                        {group.is_private ? (
                                            <Badge variant="secondary" className="bg-royal-purple/20">
                                                <Lock className="h-3 w-3 mr-1"/>
                                                Private
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-royal-green/20">
                                                <Globe className="h-3 w-3 mr-1"/>
                                                Public
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-muted-foreground mb-4 leading-relaxed">{group.description}</p>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4"/>
                        {memberCount} members
                    </span>
                                        <span>Created by {group.profiles?.display_name}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {isCreator && (
                                        <>
                                            <Dialog open={editGroupOpen} onOpenChange={setEditGroupOpen}>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" variant="outline"
                                                            className="border-royal-green/20 bg-transparent">
                                                        <Edit className="h-4 w-4 mr-2"/>
                                                        Edit
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-card border-royal-green/20">
                                                    <DialogHeader>
                                                        <DialogTitle>Edit Group</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <Label>Group Name</Label>
                                                            <Input
                                                                value={groupSettings.name}
                                                                onChange={(e) => setGroupSettings({
                                                                    ...groupSettings,
                                                                    name: e.target.value
                                                                })}
                                                                className="mt-2"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label>Description</Label>
                                                            <Textarea
                                                                value={groupSettings.description}
                                                                onChange={(e) => setGroupSettings({
                                                                    ...groupSettings,
                                                                    description: e.target.value
                                                                })}
                                                                className="mt-2"
                                                                rows={4}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label>Privacy</Label>
                                                            <select
                                                                className="w-full rounded-md border border-input bg-background px-3 py-2 mt-2"
                                                                value={groupSettings.is_private ? "private" : "public"}
                                                                onChange={(e) =>
                                                                    setGroupSettings({
                                                                        ...groupSettings,
                                                                        is_private: e.target.value === "private"
                                                                    })
                                                                }
                                                            >
                                                                <option value="public">Public - Anyone can join</option>
                                                                <option value="private">Private - Invite only</option>
                                                            </select>
                                                        </div>
                                                        <Button onClick={handleUpdateGroup} className="w-full">
                                                            Save Changes
                                                        </Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleDeleteGroup}
                                                className="border-red-500/20 text-red-500 hover:bg-red-500/10 bg-transparent"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2"/>
                                                Delete
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        onClick={handleJoinLeave}
                                        className={
                                            isMember
                                                ? "bg-card border border-royal-green hover:bg-card/80"
                                                : "bg-gradient-to-r from-royal-green to-emerald-600 hover:opacity-90"
                                        }
                                    >
                                        {isMember ? "Leave Group" : "Join Group"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Tabs defaultValue="feed" className="space-y-6">
                        <TabsList className="grid grid-cols-3 bg-card border border-royal-green/20">
                            <TabsTrigger value="feed">Feed</TabsTrigger>
                            <TabsTrigger value="events">Events ({events.length})</TabsTrigger>
                            <TabsTrigger value="members">Members ({memberCount})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="feed" className="space-y-6">
                            <div className="flex justify-end">
                                <FeedViewSettings currentSize={displaySize} onSizeChange={handleDisplaySizeChange}/>
                            </div>

                            {isMember && userProfile &&
                                <EnhancedCreatePost userProfile={userProfile} onPostCreated={loadPosts}/>}
                            {posts.map((post) => (
                                <PostCard key={post.id} post={post} displaySize={displaySize}/>
                            ))}
                            {posts.length === 0 && (
                                <div
                                    className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-royal-green/20">
                                    <p>No posts
                                        yet. {isMember ? "Be the first to post!" : "Join the group to see posts."}</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="events" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {events.map((event) => (
                                    <Link key={event.id} href={`/events/${event.id}`}>
                                        <div
                                            className="bg-card rounded-lg border border-royal-orange/20 p-4 hover:border-royal-orange/40 transition-all cursor-pointer">
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-royal-orange to-amber-600 flex-shrink-0">
                                                    <Calendar className="h-6 w-6 text-white"/>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold truncate">{event.title}</h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        {new Date(event.start_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            {events.length === 0 && (
                                <div
                                    className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-royal-orange/20">
                                    <p>No events scheduled yet.</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="members" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {members.map((member) => (
                                    <Link key={member.id} href={`/profile/${member.user_id}`}>
                                        <div
                                            className="bg-card rounded-lg border border-royal-green/20 p-4 flex items-center gap-3 hover:border-royal-green/40 transition-colors cursor-pointer">
                                            <Avatar className="h-12 w-12 border-2 border-royal-green">
                                                <AvatarImage src={member.profiles?.avatar_url || undefined}/>
                                                <AvatarFallback
                                                    className="bg-gradient-to-br from-royal-green to-emerald-600 text-white">
                                                    {member.profiles?.display_name?.[0]?.toUpperCase() ||
                                                        member.profiles?.username?.[0]?.toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-semibold text-foreground">
                                                    {member.profiles?.display_name || member.profiles?.username}
                                                </p>
                                                <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </>
    );
}
