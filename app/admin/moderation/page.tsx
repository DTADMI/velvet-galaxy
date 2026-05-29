"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle, Eye, Flag, XCircle } from "lucide-react";

interface Report {
    id: string;
    reporter_id: string;
    content_type: string;
    content_id: string;
    reason: string;
    description: string | null;
    status: "pending" | "reviewing" | "resolved" | "dismissed";
    reviewed_by: string | null;
    reviewed_at: string | null;
    resolution_notes: string | null;
    created_at: string;
    profiles: {
        username: string;
        display_name: string;
    };
}

export default function AdminModerationPage() {
    const supabase = createBrowserClient();
    const [isAdmin, setIsAdmin] = useState(false);
    const [checking, setChecking] = useState(true);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [reviewNotes, setReviewNotes] = useState("");
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

    useEffect(() => {
        async function check() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("is_admin")
                    .eq("id", user.id)
                    .single();
                setIsAdmin(profile?.is_admin ?? false);
            }
            setChecking(false);
        }
        check();
    }, []);

    const { data: reports, isLoading, refetch } = useQuery<Report[]>({
        queryKey: ["admin", "reports"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("reports")
                .select(`
                    *,
                    profiles:reporter_id(username, display_name)
                `)
                .order("created_at", { ascending: false })
                .limit(200);

            if (error) throw error;
            return (data as Report[]) || [];
        },
        enabled: isAdmin,
        refetchInterval: 15_000,
    });

    const handleAction = async (
        reportId: string,
        status: "resolved" | "dismissed" | "reviewing"
    ) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from("reports")
            .update({
                status,
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString(),
                resolution_notes: reviewNotes || null,
            })
            .eq("id", reportId);

        if (error) {
            toast.error("Failed to update report");
        } else {
            toast.success(`Report ${status}`);
            setReviewDialogOpen(false);
            setSelectedReport(null);
            setReviewNotes("");
            refetch();
        }
    };

    const openReviewDialog = (report: Report) => {
        setSelectedReport(report);
        setReviewNotes(report.resolution_notes || "");
        setReviewDialogOpen(true);
    };

    if (checking) {
        return (
            <div className="container mx-auto p-6">
                <Skeleton className="h-8 w-48" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="container mx-auto p-6">
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">Admin access required.</p>
            </div>
        );
    }

    const pendingCount = reports?.filter(r => r.status === "pending").length ?? 0;
    const reviewingCount = reports?.filter(r => r.status === "reviewing").length ?? 0;
    const resolvedCount = reports?.filter(r => r.status === "resolved").length ?? 0;
    const dismissedCount = reports?.filter(r => r.status === "dismissed").length ?? 0;

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Content Moderation</h1>
                    <p className="text-muted-foreground">Review and manage reported content</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                {[
                    { label: "Pending", value: pendingCount, variant: "destructive" as const },
                    { label: "Reviewing", value: reviewingCount, variant: "secondary" as const },
                    { label: "Resolved", value: resolvedCount, variant: "default" as const },
                    { label: "Dismissed", value: dismissedCount, variant: "outline" as const },
                ].map((stat) => (
                    <Card key={stat.label}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-royal-purple/20 bg-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Flag className="h-5 w-5" />
                        Reported Content
                    </CardTitle>
                    <CardDescription>
                        Review, investigate, and resolve user reports
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-16" />
                            ))}
                        </div>
                    ) : reports && reports.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Reporter</TableHead>
                                    <TableHead>Content</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports.map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell>
                                            <p className="font-medium text-sm">
                                                {report.profiles?.display_name || "Unknown"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                @{report.profiles?.username || "unknown"}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {report.content_type}
                                            </Badge>
                                            <p className="text-xs text-muted-foreground mt-1 font-mono">
                                                {report.content_id.slice(0, 8)}...
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-xs">
                                                {report.reason.replace(/_/g, " ")}
                                            </Badge>
                                            {report.description && (
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                                    {report.description}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    report.status === "pending"
                                                        ? "destructive"
                                                        : report.status === "reviewing"
                                                            ? "secondary"
                                                            : report.status === "resolved"
                                                                ? "default"
                                                                : "outline"
                                                }
                                            >
                                                {report.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(report.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openReviewDialog(report)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Review
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center py-8 text-muted-foreground">
                            No reports found. All clear.
                        </p>
                    )}
                </CardContent>
            </Card>

            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Review Report</DialogTitle>
                        <DialogDescription>
                            Investigate and take action on this reported content
                        </DialogDescription>
                    </DialogHeader>

                    {selectedReport && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Reporter</Label>
                                    <p className="text-sm mt-1">
                                        {selectedReport.profiles?.display_name} (@{selectedReport.profiles?.username})
                                    </p>
                                </div>
                                <div>
                                    <Label>Content Type</Label>
                                    <p className="text-sm mt-1 capitalize font-mono">
                                        {selectedReport.content_type}
                                    </p>
                                </div>
                                <div>
                                    <Label>Reason</Label>
                                    <Badge variant="secondary" className="mt-1">
                                        {selectedReport.reason.replace(/_/g, " ")}
                                    </Badge>
                                </div>
                                <div>
                                    <Label>Content ID</Label>
                                    <p className="text-sm mt-1 font-mono">{selectedReport.content_id}</p>
                                </div>
                            </div>

                            {selectedReport.description && (
                                <div>
                                    <Label>Reporter Description</Label>
                                    <p className="text-sm mt-1 p-3 rounded bg-muted/50">
                                        {selectedReport.description}
                                    </p>
                                </div>
                            )}

                            <div>
                                <Label htmlFor="resolution-notes">Resolution Notes</Label>
                                <Textarea
                                    id="resolution-notes"
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Add notes about your decision..."
                                    className="mt-1"
                                />
                            </div>

                            <div className="flex gap-2 justify-end">
                                {selectedReport.status !== "reviewing" && (
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleAction(selectedReport.id, "reviewing")}
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Mark Reviewing
                                    </Button>
                                )}
                                <Button
                                    variant="destructive"
                                    onClick={() => handleAction(selectedReport.id, "dismissed")}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Dismiss
                                </Button>
                                <Button
                                    onClick={() => handleAction(selectedReport.id, "resolved")}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Resolve
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
