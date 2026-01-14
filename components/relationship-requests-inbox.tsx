"use client";

import {Check, Inbox, Send as SendIcon, X} from "lucide-react";
import {useEffect, useState} from "react";
import Link from "next/link";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {createBrowserClient} from "@/lib/supabase/client";
import {toast} from "sonner";

interface Profile {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
}

interface CustomRelationshipType {
    id: string;
    label: string;
    node_color: string;
    edge_color: string;
}

interface RelationshipRequest {
    id: string;
    initiator_id: string;
    recipient_id: string;
    relationship_type_id: string | null;
    default_type: string | null;
    status: string;
    message: string | null;
    created_at: string;
    initiator_profile?: Profile;
    recipient_profile?: Profile;
    custom_relationship_type?: CustomRelationshipType;
}

export function RelationshipRequestsInbox({userId}: { userId: string }) {
    const [incomingRequests, setIncomingRequests] = useState<RelationshipRequest[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<RelationshipRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createBrowserClient();

    useEffect(() => {
        loadRequests();

        // Subscribe to changes
        const channel = supabase
            .channel('relationship_requests')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_relationships',
                    filter: `recipient_id=eq.${userId}`
                },
                () => loadRequests()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    async function loadRequests() {
        setIsLoading(true);

        // Load incoming requests
        const {data: incoming} = await supabase
            .from('user_relationships')
            .select(`
                *,
                initiator_profile:profiles!user_relationships_initiator_id_fkey(id, username, display_name, avatar_url),
                custom_relationship_type:custom_relationship_types(id, label, node_color, edge_color)
            `)
            .eq('recipient_id', userId)
            .eq('status', 'pending')
            .order('created_at', {ascending: false});

        // Load outgoing requests
        const {data: outgoing} = await supabase
            .from('user_relationships')
            .select(`
                *,
                recipient_profile:profiles!user_relationships_recipient_id_fkey(id, username, display_name, avatar_url),
                custom_relationship_type:custom_relationship_types(id, label, node_color, edge_color)
            `)
            .eq('initiator_id', userId)
            .eq('status', 'pending')
            .order('created_at', {ascending: false});

        setIncomingRequests(incoming || []);
        setOutgoingRequests(outgoing || []);
        setIsLoading(false);
    }

    async function handleAccept(requestId: string) {
        const {error} = await supabase
            .from('user_relationships')
            .update({status: 'accepted'})
            .eq('id', requestId);

        if (error) {
            toast.error('Failed to accept request');
            console.error(error);
            return;
        }

        toast.success('Relationship request accepted!');
        loadRequests();
    }

    async function handleDecline(requestId: string) {
        const {error} = await supabase
            .from('user_relationships')
            .update({status: 'declined'})
            .eq('id', requestId);

        if (error) {
            toast.error('Failed to decline request');
            console.error(error);
            return;
        }

        toast.success('Request declined');
        loadRequests();
    }

    async function handleCancel(requestId: string) {
        const {error} = await supabase
            .from('user_relationships')
            .delete()
            .eq('id', requestId);

        if (error) {
            toast.error('Failed to cancel request');
            console.error(error);
            return;
        }

        toast.success('Request cancelled');
        loadRequests();
    }

    function getRelationshipLabel(request: RelationshipRequest): string {
        if (request.custom_relationship_type) {
            return request.custom_relationship_type.label;
        }
        if (request.default_type) {
            return request.default_type.charAt(0).toUpperCase() + request.default_type.slice(1);
        }
        return 'Unknown';
    }

    function getRelationshipColor(request: RelationshipRequest): { node: string; edge: string } {
        if (request.custom_relationship_type) {
            return {
                node: request.custom_relationship_type.node_color,
                edge: request.custom_relationship_type.edge_color
            };
        }
        return {node: '#8b5cf6', edge: '#a855f7'};
    }

    return (
        <Card className="border-royal-purple/20">
            <CardHeader>
                <CardTitle>Relationship Requests</CardTitle>
                <CardDescription>
                    Manage incoming and outgoing relationship requests
                </CardDescription>
            </CardHeader>

            <CardContent>
                <Tabs defaultValue="incoming">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="incoming">
                            <Inbox className="h-4 w-4 mr-2"/>
                            Incoming ({incomingRequests.length})
                        </TabsTrigger>
                        <TabsTrigger value="outgoing">
                            <SendIcon className="h-4 w-4 mr-2"/>
                            Sent ({outgoingRequests.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="incoming" className="mt-4 space-y-3">
                        {isLoading ? (
                            <p className="text-center py-8 text-muted-foreground">Loading...</p>
                        ) : incomingRequests.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                                <p>No incoming requests</p>
                            </div>
                        ) : (
                            incomingRequests.map((request) => {
                                const profile = request.initiator_profile;
                                const colors = getRelationshipColor(request);

                                return (
                                    <div
                                        key={request.id}
                                        className="flex items-start gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
                                        style={{borderColor: colors.edge + '40'}}
                                    >
                                        <Link href={`/profile/${profile?.id}`}>
                                            <Avatar className="h-12 w-12 border-2" style={{borderColor: colors.node}}>
                                                <AvatarImage src={profile?.avatar_url || undefined}/>
                                                <AvatarFallback
                                                    className="bg-gradient-to-br from-royal-purple to-royal-blue text-white">
                                                    {profile?.display_name?.[0]?.toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Link>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Link
                                                    href={`/profile/${profile?.id}`}
                                                    className="font-semibold hover:underline"
                                                >
                                                    {profile?.display_name || profile?.username}
                                                </Link>
                                                <Badge variant="outline" style={{
                                                    backgroundColor: colors.node + '20',
                                                    borderColor: colors.edge
                                                }}>
                                                    {getRelationshipLabel(request)}
                                                </Badge>
                                            </div>

                                            {request.message && (
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    "{request.message}"
                                                </p>
                                            )}

                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAccept(request.id)}
                                                    className="bg-gradient-to-r from-green-600 to-emerald-600"
                                                >
                                                    <Check className="h-4 w-4 mr-1"/>
                                                    Accept
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDecline(request.id)}
                                                >
                                                    <X className="h-4 w-4 mr-1"/>
                                                    Decline
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </TabsContent>

                    <TabsContent value="outgoing" className="mt-4 space-y-3">
                        {isLoading ? (
                            <p className="text-center py-8 text-muted-foreground">Loading...</p>
                        ) : outgoingRequests.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <SendIcon className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                                <p>No sent requests</p>
                            </div>
                        ) : (
                            outgoingRequests.map((request) => {
                                const profile = request.recipient_profile;
                                const colors = getRelationshipColor(request);

                                return (
                                    <div
                                        key={request.id}
                                        className="flex items-start gap-3 p-4 rounded-lg border"
                                        style={{borderColor: colors.edge + '40'}}
                                    >
                                        <Link href={`/profile/${profile?.id}`}>
                                            <Avatar className="h-12 w-12 border-2" style={{borderColor: colors.node}}>
                                                <AvatarImage src={profile?.avatar_url || undefined}/>
                                                <AvatarFallback
                                                    className="bg-gradient-to-br from-royal-purple to-royal-blue text-white">
                                                    {profile?.display_name?.[0]?.toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Link>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Link
                                                    href={`/profile/${profile?.id}`}
                                                    className="font-semibold hover:underline"
                                                >
                                                    {profile?.display_name || profile?.username}
                                                </Link>
                                                <Badge variant="outline" style={{
                                                    backgroundColor: colors.node + '20',
                                                    borderColor: colors.edge
                                                }}>
                                                    {getRelationshipLabel(request)}
                                                </Badge>
                                                <Badge variant="secondary">Pending</Badge>
                                            </div>

                                            {request.message && (
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    "{request.message}"
                                                </p>
                                            )}

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleCancel(request.id)}
                                            >
                                                Cancel Request
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
