"use client";

import {Globe, Lock, UsersRound} from "lucide-react";
import Link from "next/link";
import {useEffect, useState} from "react";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import {createClient} from "@/lib/supabase/client";

interface ProfileGroupsProps {
    userId: string
}

export function ProfileGroups({userId}: ProfileGroupsProps) {
    const [groups, setGroups] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadGroups();
    }, [userId]);

    const loadGroups = async () => {
        setIsLoading(true);
        const supabase = createClient();

        const {data, error} = await supabase
            .from("group_members")
            .select(`
        *,
        groups:group_id (
          id,
          name,
          description,
          image_url,
          is_private,
          content_rating,
          created_at,
          creator_id
        )
      `)
            .eq("user_id", userId)
            .order("joined_at", {ascending: false});

        if (error) {
            console.error("[v0] Error loading groups:", error);
        } else {
            setGroups(data?.filter((m: any) => m.groups) || []);
        }

        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <Card className="border-royal-purple/20 bg-card/50">
                <CardContent className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-purple mx-auto"/>
                    <p className="text-muted-foreground mt-4">Loading groups...</p>
                </CardContent>
            </Card>
        );
    }

    if (groups.length === 0) {
        return (
            <Card className="border-royal-purple/20 bg-card/50">
                <CardContent className="p-12 text-center">
                    <div className="flex justify-center mb-4 text-muted-foreground">
                        <UsersRound className="h-12 w-12"/>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
                    <p className="text-muted-foreground">Join your first group to get started!</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-royal-purple/20 bg-card/50">
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map((membership) => {
                        const group = membership.groups;
                        return (
                            <Link key={group.id} href={`/groups/${group.id}`}>
                                <Card
                                    className="border-royal-purple/20 hover:border-royal-purple/40 transition-all cursor-pointer h-full">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <Avatar className="h-16 w-16 border-2 border-royal-purple/20">
                                                <AvatarImage src={group.image_url || undefined}/>
                                                <AvatarFallback
                                                    className="bg-gradient-to-br from-royal-purple to-royal-blue text-white">
                                                    {group.name[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold truncate">{group.name}</h3>
                                                    {group.is_private ? (
                                                        <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                                    ) : (
                                                        <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                                    )}
                                                </div>
                                                {group.description && (
                                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{group.description}</p>
                                                )}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant="secondary" className="text-xs capitalize">
                                                        {membership.role}
                                                    </Badge>
                                                    {group.content_rating === "nsfw" &&
                                                        <Badge className="text-xs bg-red-500">NSFW</Badge>}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
