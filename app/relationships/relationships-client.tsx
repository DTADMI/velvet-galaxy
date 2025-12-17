"use client";

import {Check, Heart, Sparkles, Star, Users, X} from "lucide-react";
import Link from "next/link";
import {useEffect, useState} from "react";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {createBrowserClient} from "@/lib/supabase/client";

const RELATIONSHIP_TYPES = [
    {value: "friend", label: "Friend", icon: Users, color: "royal-blue"},
    {value: "partner", label: "Partner", icon: Heart, color: "royal-auburn"},
    {value: "crush", label: "Crush", icon: Sparkles, color: "royal-purple"},
    {value: "admirer", label: "Admirer", icon: Star, color: "royal-orange"},
    {value: "mentor", label: "Mentor", icon: Users, color: "royal-green"},
    {value: "mentee", label: "Mentee", icon: Users, color: "royal-green"},
    {value: "play_partner", label: "Play Partner", icon: Heart, color: "royal-purple"},
    {value: "romantic_interest", label: "Romantic Interest", icon: Heart, color: "royal-auburn"},
    {value: "ex", label: "Ex", icon: Heart, color: "gray"},
    {value: "family", label: "Family", icon: Users, color: "royal-blue"},
    {value: "other", label: "Other", icon: Users, color: "gray"},
];

export function RelationshipsClient({userId}: { userId: string }) {
    const [myRelationships, setMyRelationships] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const supabase = createBrowserClient();

    useEffect(() => {
        loadRelationships();
        loadPendingRequests();
    }, []);

    const loadRelationships = async () => {
        const {data} = await supabase
            .from("relationships")
            .select("*, profiles!relationships_related_user_id_fkey(id, username, display_name, avatar_url)")
            .eq("user_id", userId)
            .eq("status", "accepted");

        if (data) {
            setMyRelationships(data);
        }
    };

    const loadPendingRequests = async () => {
        const {data} = await supabase
            .from("relationships")
            .select("*, profiles!relationships_user_id_fkey(id, username, display_name, avatar_url)")
            .eq("related_user_id", userId)
            .eq("status", "pending");

        if (data) {
            setPendingRequests(data);
        }
    };

    const acceptRequest = async (relationshipId: string) => {
        await supabase.from("relationships").update({status: "accepted"}).eq("id", relationshipId);
        loadPendingRequests();
        loadRelationships();
    };

    const declineRequest = async (relationshipId: string) => {
        await supabase.from("relationships").delete().eq("id", relationshipId);
        loadPendingRequests();
    };

    const getRelationshipIcon = (type: string) => {
        const rel = RELATIONSHIP_TYPES.find((r) => r.value === type);
        return rel ? rel.icon : Users;
    };

    const getRelationshipColor = (type: string) => {
        const rel = RELATIONSHIP_TYPES.find((r) => r.value === type);
        return rel ? rel.color : "gray";
    };

    const getRelationshipLabel = (relationship: any) => {
        if (relationship.custom_label) {
            return relationship.custom_label;
        }
        const rel = RELATIONSHIP_TYPES.find((r) => r.value === relationship.relationship_type);
        return rel ? rel.label : relationship.relationship_type;
    };

    const groupedRelationships = RELATIONSHIP_TYPES.reduce(
        (acc, type) => {
            acc[type.value] = myRelationships.filter((r) => r.relationship_type === type.value);
            return acc;
        },
        {} as Record<string, any[]>,
    );

    return (
        <div className="space-y-6">
            {pendingRequests.length > 0 && (
                <Card className="p-6 border-royal-orange/40 bg-royal-orange/5">
                    <h2 className="text-xl font-semibold mb-4">Pending Requests ({pendingRequests.length})</h2>
                    <div className="space-y-3">
                        {pendingRequests.map((request) => (
                            <div
                                key={request.id}
                                className="flex items-center justify-between p-4 bg-card rounded-lg border border-border"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 border-2 border-royal-orange">
                                        <AvatarImage src={request.profiles?.avatar_url || undefined}/>
                                        <AvatarFallback
                                            className="bg-gradient-to-br from-royal-orange to-amber-600 text-white">
                                            {request.profiles?.display_name?.[0]?.toUpperCase() ||
                                                request.profiles?.username?.[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{request.profiles?.display_name || request.profiles?.username}</p>
                                        <Badge variant="secondary"
                                               className={`bg-${getRelationshipColor(request.relationship_type)}/20`}>
                                            {getRelationshipLabel(request)}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => acceptRequest(request.id)}
                                            className="bg-royal-green">
                                        <Check className="h-4 w-4 mr-1"/>
                                        Accept
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => declineRequest(request.id)}>
                                        <X className="h-4 w-4 mr-1"/>
                                        Decline
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <Tabs defaultValue="all" className="space-y-6">
                <TabsList className="grid grid-cols-4 lg:grid-cols-6 bg-card">
                    <TabsTrigger value="all">All ({myRelationships.length})</TabsTrigger>
                    <TabsTrigger value="friend">Friends ({groupedRelationships.friend?.length || 0})</TabsTrigger>
                    <TabsTrigger value="partner">Partners ({groupedRelationships.partner?.length || 0})</TabsTrigger>
                    <TabsTrigger value="crush">Crushes ({groupedRelationships.crush?.length || 0})</TabsTrigger>
                    <TabsTrigger value="mentor">Mentors ({groupedRelationships.mentor?.length || 0})</TabsTrigger>
                    <TabsTrigger value="other">Other</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myRelationships.map((rel) => {
                            const Icon = getRelationshipIcon(rel.relationship_type);
                            const color = getRelationshipColor(rel.relationship_type);
                            return (
                                <Card key={rel.id} className="p-4 hover:border-royal-purple/40 transition-colors">
                                    <Link href={`/profile/${rel.related_user_id}`}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <Avatar className={`h-14 w-14 border-2 border-${color}`}>
                                                <AvatarImage src={rel.profiles?.avatar_url || undefined}/>
                                                <AvatarFallback
                                                    className={`bg-gradient-to-br from-${color} to-${color}-dark text-white`}>
                                                    {rel.profiles?.display_name?.[0]?.toUpperCase() || rel.profiles?.username?.[0]?.toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-semibold">{rel.profiles?.display_name || rel.profiles?.username}</p>
                                                <p className="text-sm text-muted-foreground">@{rel.profiles?.username}</p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className={`bg-${color}/20`}>
                                            <Icon className="h-3 w-3 mr-1"/>
                                            {getRelationshipLabel(rel)}
                                        </Badge>
                                    </Link>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                {RELATIONSHIP_TYPES.slice(0, 5).map((type) => (
                    <TabsContent key={type.value} value={type.value} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groupedRelationships[type.value]?.map((rel) => {
                                const Icon = type.icon;
                                return (
                                    <Card key={rel.id} className="p-4 hover:border-royal-purple/40 transition-colors">
                                        <Link href={`/profile/${rel.related_user_id}`}>
                                            <div className="flex items-center gap-3 mb-3">
                                                <Avatar className={`h-14 w-14 border-2 border-${type.color}`}>
                                                    <AvatarImage src={rel.profiles?.avatar_url || undefined}/>
                                                    <AvatarFallback
                                                        className={`bg-gradient-to-br from-${type.color} to-${type.color}-dark text-white`}
                                                    >
                                                        {rel.profiles?.display_name?.[0]?.toUpperCase() ||
                                                            rel.profiles?.username?.[0]?.toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="font-semibold">{rel.profiles?.display_name || rel.profiles?.username}</p>
                                                    <p className="text-sm text-muted-foreground">@{rel.profiles?.username}</p>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className={`bg-${type.color}/20`}>
                                                <Icon className="h-3 w-3 mr-1"/>
                                                {getRelationshipLabel(rel)}
                                            </Badge>
                                        </Link>
                                    </Card>
                                );
                            })}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
