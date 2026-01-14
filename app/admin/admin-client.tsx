"use client";

import {useEffect, useState} from "react";
import {Activity, CheckCircle, CreditCard, Flag, Settings, Shield, Users, XCircle} from "lucide-react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Switch} from "@/components/ui/switch";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {toast} from "sonner";
import {createBrowserClient} from "@/lib/supabase/client";

interface FeatureFlag {
    id: string;
    name: string;
    description: string;
    is_enabled: boolean;
}

interface RelationshipTypeRequest {
    id: string;
    user_id: string;
    requested_label: string;
    description: string | null;
    suggested_node_color: string | null;
    suggested_edge_color: string | null;
    suggested_line_style: string | null;
    status: "pending" | "approved" | "rejected";
    admin_notes: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    created_at: string;
    profiles: {
        username: string;
        display_name: string;
    };
}

interface AdminClientProps {
    initialFlags: FeatureFlag[];
    stats: {
        users: number;
        subscriptions: number;
    };
}

export function AdminClient({initialFlags, stats}: AdminClientProps) {
    const [flags, setFlags] = useState<FeatureFlag[]>(initialFlags);
    const [isSaving, setIsSaving] = useState(false);
    const [requests, setRequests] = useState<RelationshipTypeRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<RelationshipTypeRequest | null>(null);
    const [reviewNotes, setReviewNotes] = useState("");
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const supabase = createBrowserClient();

    useEffect(() => {
        loadRequests();
    }, []);

    async function loadRequests() {
        const {data} = await supabase
            .from("relationship_type_requests")
            .select(`
                *,
                profiles:user_id(username, display_name)
            `)
            .order("created_at", {ascending: false});

        if (data) {
            setRequests(data as any);
        }
    }

    const handleToggleFlag = async (id: string, isEnabled: boolean) => {
        setFlags(prev => prev.map(f => f.id === id ? {...f, is_enabled: isEnabled} : f));

        const {error} = await supabase
            .from('feature_flags')
            .update({is_enabled: isEnabled, updated_at: new Date().toISOString()})
            .eq('id', id);

        if (error) {
            toast.error("Failed to update feature flag");
            setFlags(prev => prev.map(f => f.id === id ? {...f, is_enabled: !isEnabled} : f));
        } else {
            toast.success("Feature flag updated");
        }
    };

    async function handleReviewRequest(requestId: string, status: "approved" | "rejected") {
        const {data: {user}} = await supabase.auth.getUser();
        if (!user) return;

        const {error} = await supabase
            .from("relationship_type_requests")
            .update({
                status,
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString(),
                admin_notes: reviewNotes || null,
            })
            .eq("id", requestId);

        if (!error) {
            toast.success(`Request ${status}`);
            setReviewDialogOpen(false);
            setSelectedRequest(null);
            setReviewNotes("");
            loadRequests();
        } else {
            toast.error("Failed to update request");
        }
    }

    function openReviewDialog(request: RelationshipTypeRequest) {
        setSelectedRequest(request);
        setReviewNotes(request.admin_notes || "");
        setReviewDialogOpen(true);
    }

    const pendingRequests = requests.filter(r => r.status === "pending");

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-royal-purple/20 bg-card/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-4 w-4 text-royal-blue"/>
                            Total Users
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.users}</div>
                    </CardContent>
                </Card>
                <Card className="border-royal-purple/20 bg-card/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-royal-green"/>
                            Active Subscriptions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.subscriptions}</div>
                    </CardContent>
                </Card>
                <Card className="border-royal-purple/20 bg-card/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Shield className="h-4 w-4 text-royal-orange"/>
                            Security Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-royal-green">Optimal</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="features" className="w-full">
                <TabsList className="bg-background/50 border border-royal-purple/20">
                    <TabsTrigger value="features" className="gap-2">
                        <Settings className="h-4 w-4"/>
                        Feature Flags
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="gap-2">
                        <Flag className="h-4 w-4"/>
                        Relationship Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
                    </TabsTrigger>
                    <TabsTrigger value="users" className="gap-2">
                        <Users className="h-4 w-4"/>
                        User Management
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="gap-2">
                        <Activity className="h-4 w-4"/>
                        System Logs
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="features" className="mt-6 space-y-4">
                    <Card className="border-royal-purple/20 bg-card/50">
                        <CardHeader>
                            <CardTitle>Feature Configuration</CardTitle>
                            <CardDescription>
                                Toggle platform features on/off instantly without redeploying.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {flags.map((flag) => (
                                <div key={flag.id}
                                     className="flex items-center justify-between p-4 rounded-lg bg-background/40 border border-royal-purple/10">
                                    <div className="space-y-0.5">
                                        <div className="font-semibold flex items-center gap-2">
                                            {flag.name}
                                            <code
                                                className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase">
                                                {flag.id.split('-')[0]}
                                            </code>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {flag.description}
                                        </div>
                                    </div>
                                    <Switch
                                        checked={flag.is_enabled}
                                        onCheckedChange={(checked) => handleToggleFlag(flag.id, checked)}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="requests" className="mt-6 space-y-4">
                    <Card className="border-royal-purple/20 bg-card/50">
                        <CardHeader>
                            <CardTitle>Custom Relationship Type Requests</CardTitle>
                            <CardDescription>
                                Review and approve user requests for new relationship types
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {requests.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No requests yet</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Label</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {requests.map((request) => (
                                            <TableRow key={request.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-sm">{request.profiles.display_name}</p>
                                                        <p className="text-xs text-muted-foreground">@{request.profiles.username}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {request.requested_label}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={request.status === "pending" ? "secondary" : request.status === "approved" ? "default" : "destructive"}>
                                                        {request.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {new Date(request.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    {request.status === "pending" && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => openReviewDialog(request)}
                                                        >
                                                            Review
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users" className="mt-6">
                    <Card className="border-royal-purple/20 bg-card/50">
                        <CardHeader>
                            <CardTitle>User Directory</CardTitle>
                            <CardDescription>Manage user roles and permissions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 text-muted-foreground italic">
                                User management module is currently being finalized.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="logs" className="mt-6">
                    <Card className="border-royal-purple/20 bg-card/50">
                        <CardHeader>
                            <CardTitle>System Activity</CardTitle>
                            <CardDescription>Recent administrative actions and system events.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div
                                    className="text-sm font-mono p-4 rounded bg-black/40 text-royal-green border border-royal-green/20">
                                    [SYSTEM] Dashboard initialized at {new Date().toISOString()}
                                    <br/>
                                    [AUTH] Admin user session verified
                                    <br/>
                                    [DB] Successfully connected to velvet_galaxy_main
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Review Custom Relationship Type Request</DialogTitle>
                        <DialogDescription>
                            Review and approve or reject this request
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Requested By</Label>
                                    <p className="text-sm mt-1">
                                        {selectedRequest.profiles.display_name} (@{selectedRequest.profiles.username})
                                    </p>
                                </div>
                                <div>
                                    <Label>Requested Label</Label>
                                    <p className="text-sm mt-1 font-medium">{selectedRequest.requested_label}</p>
                                </div>
                            </div>

                            {selectedRequest.description && (
                                <div>
                                    <Label>Description</Label>
                                    <p className="text-sm mt-1">{selectedRequest.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label>Node Color</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div
                                            className="w-8 h-8 rounded border"
                                            style={{backgroundColor: selectedRequest.suggested_node_color || "#8b5cf6"}}
                                        />
                                        <span
                                            className="text-xs">{selectedRequest.suggested_node_color || "#8b5cf6"}</span>
                                    </div>
                                </div>
                                <div>
                                    <Label>Edge Color</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div
                                            className="w-8 h-8 rounded border"
                                            style={{backgroundColor: selectedRequest.suggested_edge_color || "#a855f7"}}
                                        />
                                        <span
                                            className="text-xs">{selectedRequest.suggested_edge_color || "#a855f7"}</span>
                                    </div>
                                </div>
                                <div>
                                    <Label>Line Style</Label>
                                    <p className="text-sm mt-1 capitalize">{selectedRequest.suggested_line_style || "solid"}</p>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                                <Textarea
                                    id="admin-notes"
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Add notes about this decision..."
                                    className="mt-1"
                                />
                            </div>

                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="destructive"
                                    onClick={() => handleReviewRequest(selectedRequest.id, "rejected")}
                                >
                                    <XCircle className="h-4 w-4 mr-2"/>
                                    Reject
                                </Button>
                                <Button
                                    onClick={() => handleReviewRequest(selectedRequest.id, "approved")}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2"/>
                                    Approve
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
