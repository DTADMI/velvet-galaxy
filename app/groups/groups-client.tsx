"use client";

import {Globe, Lock, Plus, Search, TrendingUp, Users} from "lucide-react";
import {useRouter} from "next/navigation";
import {useCallback, useEffect, useState} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardFooter, CardHeader} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Textarea} from "@/components/ui/textarea";
import {createBrowserClient} from "@/lib/supabase/client";

interface Group {
    id: string
    name: string
    description?: string
    image_url?: string
    is_private: boolean
    member_count: number
    is_member: boolean
    creator_id: string
}

export function GroupsClient({userId}: { userId?: string }) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("discover");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupDescription, setNewGroupDescription] = useState("");
    const [newGroupPrivacy, setNewGroupPrivacy] = useState("public");
    const supabase = createBrowserClient();
    const router = useRouter();

    const loadGroups = useCallback(async () => {
        if (activeTab === "my-groups" && userId) {
            const {data} = await supabase.from("group_members").select("group_id, groups(*)").eq("user_id", userId);

            if (data) {
                const groupsData = data.map((item: any) => ({
                    ...item.groups,
                    is_member: true,
                    member_count: 0,
                }));
                setGroups(groupsData);
            }
        } else {
            const {data} = await supabase.from("groups").select("*").limit(20);

            if (data) {
                const groupsWithMemberCount = await Promise.all(
                    data.map(async (group: Group) => {
                        const {count} = await supabase
                            .from("group_members")
                            .select("id", {count: "exact"})
                            .eq("group_id", group.id);

                        const {data: memberData} = await supabase
                            .from("group_members")
                            .select("id")
                            .eq("group_id", group.id)
                            .eq("user_id", userId || "")
                            .single();

                        return {
                            ...group,
                            member_count: count || 0,
                            is_member: !!memberData,
                        };
                    }),
                );
                setGroups(groupsWithMemberCount);
            }
        }
    }, [activeTab, userId, supabase]);

    const joinGroup = async (groupId: string) => {
        if (!userId) {
            return;
        }
        await supabase.from("group_members").insert({group_id: groupId, user_id: userId});
        loadGroups();
    };

    const leaveGroup = async (groupId: string) => {
        if (!userId) {
            return;
        }
        await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId);
        loadGroups();
    };

    const createGroup = async () => {
        if (!userId || !newGroupName.trim()) {
            return;
        }

        console.log("[v0] Creating group:", {name: newGroupName, isPrivate: newGroupPrivacy === "private"});

        const {data, error} = await supabase
            .from("groups")
            .insert({
                name: newGroupName,
                description: newGroupDescription,
                creator_id: userId,
                is_private: newGroupPrivacy === "private",
            })
            .select()
            .single();

        if (error) {
            console.error("[v0] Error creating group:", error.message || error);
            alert(`Failed to create group: ${error.message || "Unknown error"}`);
            return;
        }

        console.log("[v0] Group created:", data);

        // Add creator as admin member
        await supabase.from("group_members").insert({
            group_id: data.id,
            user_id: userId,
            role: "admin",
        });

        // Reset form and close dialog
        setNewGroupName("");
        setNewGroupDescription("");
        setNewGroupPrivacy("public");
        setIsCreateDialogOpen(false);
        loadGroups();
    };

    const deleteGroup = async (groupId: string) => {
        if (!userId) {
            return;
        }
        if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
            return;
        }

        try {
            // Delete all group members first
            await supabase.from("group_members").delete().eq("group_id", groupId);

            // Delete all posts in the group
            await supabase.from("posts").delete().eq("group_id", groupId);

            // Delete all events in the group
            await supabase.from("events").delete().eq("group_id", groupId);

            // Delete the group
            const {error} = await supabase.from("groups").delete().eq("id", groupId);

            if (error) {
                throw error;
            }

            loadGroups();
        } catch (error) {
            console.error("[v0] Error deleting group:", error);
            alert("Failed to delete group");
        }
    };

    const filteredGroups = groups.filter(
        (group: Group) =>
            group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            group.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    useEffect(() => {
        loadGroups();
    }, [activeTab, loadGroups]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                    <Input
                        placeholder="Search groups by name or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 h-12 bg-card/50 border-royal-green/20 focus:border-royal-green/40"
                    />
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-linear-to-r from-royal-green to-emerald-600 hover:opacity-90 h-12 px-6">
                            <Plus className="h-5 w-5 mr-2"/>
                            Create Group
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-royal-green/20 max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-2xl text-linear">Create New Group</DialogTitle>
                            <DialogDescription>Build a community around your interests</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-base">Group Name</Label>
                                <Input
                                    placeholder="Enter a descriptive group name"
                                    className="mt-2"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-base">Description</Label>
                                <Textarea
                                    placeholder="What is your group about? What will members do together?"
                                    className="mt-2"
                                    rows={4}
                                    value={newGroupDescription}
                                    onChange={(e) => setNewGroupDescription(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-base">Privacy</Label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 mt-2"
                                    value={newGroupPrivacy}
                                    onChange={(e) => setNewGroupPrivacy(e.target.value)}
                                >
                                    <option value="public">Public - Anyone can join</option>
                                    <option value="private">Private - Invite only</option>
                                </select>
                            </div>
                            <Button
                                className="w-full bg-linear-to-r from-royal-green to-emerald-600 h-11"
                                onClick={createGroup}
                                disabled={!newGroupName.trim()}
                            >
                                Create Group
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 bg-card/50 border border-royal-green/20 h-12">
                    <TabsTrigger value="discover" className="text-base">
                        <TrendingUp className="h-4 w-4 mr-2"/>
                        Discover Groups
                    </TabsTrigger>
                    <TabsTrigger value="my-groups" className="text-base">
                        <Users className="h-4 w-4 mr-2"/>
                        My Groups
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredGroups.map((group) => (
                            <Card
                                key={group.id}
                                className="overflow-hidden hover:border-royal-green/50 hover:shadow-lg hover:shadow-royal-green/10 transition-all bg-card/50 border-royal-green/20 cursor-pointer group"
                                onClick={() => router.push(`/groups/${group.id}`)}
                            >
                                <CardHeader className="p-0">
                                    <div
                                        className="h-40 bg-linear-to-br from-royal-green to-emerald-600 flex items-center justify-center relative overflow-hidden">
                                        {group.image_url ? (
                                            <img
                                                src={group.image_url || "/placeholder.svg"}
                                                alt={group.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <Users
                                                className="h-16 w-16 text-white group-hover:scale-110 transition-transform"/>
                                        )}
                                        <div className="absolute top-3 right-3">
                                            {group.is_private ? (
                                                <Badge
                                                    className="bg-background/90 text-foreground border border-royal-green/20">
                                                    <Lock className="h-3 w-3 mr-1"/>
                                                    Private
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    className="bg-background/90 text-foreground border border-royal-green/20">
                                                    <Globe className="h-3 w-3 mr-1"/>
                                                    Public
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-5">
                                    <h3 className="font-bold text-xl mb-2 line-clamp-1 group-hover:text-royal-green transition-colors">
                                        {group.name}
                                    </h3>
                                    {group.description && (
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                                            {group.description}
                                        </p>
                                    )}
                                    <Badge variant="secondary"
                                           className="bg-royal-green/10 text-royal-green border-royal-green/20">
                                        <Users className="h-3 w-3 mr-1"/>
                                        {group.member_count} {group.member_count === 1 ? "member" : "members"}
                                    </Badge>
                                </CardContent>
                                <CardFooter className="p-5 pt-0 flex gap-2">
                                    {group.creator_id === userId ? (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/groups/${group.id}`);
                                                }}
                                                className="flex-1 border-royal-green/30 hover:bg-royal-green/10"
                                            >
                                                Manage
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteGroup(group.id);
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </>
                                    ) : group.is_member ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                leaveGroup(group.id);
                                            }}
                                            className="flex-1 border-royal-green/30 hover:bg-royal-green/10"
                                        >
                                            Leave Group
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                joinGroup(group.id);
                                            }}
                                            className="flex-1 bg-linear-to-r from-royal-green to-emerald-600 hover:opacity-90"
                                        >
                                            Join Group
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                    {filteredGroups.length === 0 && (
                        <Card className="border-royal-green/20">
                            <CardContent className="text-center py-16">
                                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground"/>
                                <h3 className="text-xl font-semibold mb-2">No groups found</h3>
                                <p className="text-muted-foreground mb-6">
                                    {activeTab === "my-groups"
                                        ? "You haven't joined any groups yet. Explore and find communities that interest you!"
                                        : "No groups match your search. Try different keywords or create a new group!"}
                                </p>
                                {activeTab === "discover" && (
                                    <Button
                                        onClick={() => setIsCreateDialogOpen(true)}
                                        className="bg-linear-to-r from-royal-green to-emerald-600"
                                    >
                                        <Plus className="h-4 w-4 mr-2"/>
                                        Create Your First Group
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
