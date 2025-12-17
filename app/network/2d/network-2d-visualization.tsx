"use client";

import {Sparkles, Users} from "lucide-react";
import Link from "next/link";
import {useEffect, useState} from "react";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {createClient} from "@/lib/supabase/client";

interface Connection {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    relationship_type: string
    mutual_connections: number
}

export function Network2DVisualization({userId}: { userId: string }) {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadConnections();
    }, []);

    const loadConnections = async () => {
        const {data: relationships} = await supabase
            .from("relationships")
            .select("*, profiles!relationships_related_user_id_fkey(id, username, display_name, avatar_url)")
            .eq("user_id", userId)
            .eq("status", "accepted");

        if (relationships) {
            const connectionsData = await Promise.all(
                relationships.map(async (rel) => {
                    // Count mutual connections
                    const {count} = await supabase
                        .from("relationships")
                        .select("*", {count: "exact", head: true})
                        .eq("user_id", rel.related_user_id)
                        .eq("status", "accepted")
                        .in(
                            "related_user_id",
                            relationships.map((r) => r.related_user_id),
                        );

                    return {
                        id: rel.profiles.id,
                        username: rel.profiles.username,
                        display_name: rel.profiles.display_name,
                        avatar_url: rel.profiles.avatar_url,
                        relationship_type: rel.relationship_type,
                        mutual_connections: count || 0,
                    };
                }),
            );
            setConnections(connectionsData);
        }
        setLoading(false);
    };

    const getRelationshipColor = (type: string) => {
        switch (type) {
            case "friend":
                return "from-royal-blue to-blue-600";
            case "partner":
                return "from-royal-auburn to-red-600";
            case "play_partner":
                return "from-royal-purple to-purple-600";
            default:
                return "from-royal-green to-emerald-600";
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gradient mb-2">Your Network</h1>
                        <p className="text-muted-foreground">{connections.length} connections in your network</p>
                    </div>
                    <Button asChild className="bg-gradient-to-r from-royal-purple to-royal-blue">
                        <Link href="/subscribe">
                            <Sparkles className="h-4 w-4 mr-2"/>
                            Upgrade for 3D View
                        </Link>
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading your network...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {connections.map((connection) => (
                        <Card key={connection.id}
                              className="border-royal-purple/20 hover:border-royal-purple/40 transition-colors">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 border-2 border-royal-purple">
                                        <AvatarImage src={connection.avatar_url || undefined}/>
                                        <AvatarFallback
                                            className={`bg-gradient-to-br ${getRelationshipColor(connection.relationship_type)} text-white`}
                                        >
                                            {(connection.display_name || connection.username)[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-base truncate">
                                            {connection.display_name || connection.username}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground truncate">@{connection.username}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Badge variant="secondary" className="capitalize">
                                        {connection.relationship_type.replace("_", " ")}
                                    </Badge>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Users className="h-4 w-4"/>
                                        <span>{connection.mutual_connections} mutual connections</span>
                                    </div>
                                    <Button asChild variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                                        <Link href={`/profile/${connection.id}`}>View Profile</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {connections.length === 0 && !loading && (
                <Card className="border-royal-purple/20">
                    <CardContent className="py-12 text-center">
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50"/>
                        <p className="text-muted-foreground mb-4">
                            You don't have any connections yet. Start building your network!
                        </p>
                        <Button asChild>
                            <Link href="/search">Find People</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
