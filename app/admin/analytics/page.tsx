"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, MessageSquare, FileText, TrendingUp, UserPlus } from "lucide-react";

interface AnalyticsData {
    totalUsers: number;
    totalPosts: number;
    totalComments: number;
    recentSignups: { id: string; username: string; display_name: string | null; created_at: string }[];
    mostActiveUsers: { id: string; username: string; display_name: string | null; post_count: number; comment_count: number }[];
}

function SkeletonCards() {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
            ))}
        </div>
    );
}

export default function AdminAnalyticsPage() {
    const supabase = createBrowserClient();
    const [isAdmin, setIsAdmin] = useState(false);
    const [checking, setChecking] = useState(true);

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

    const { data: analytics, isLoading } = useQuery<AnalyticsData>({
        queryKey: ["admin", "analytics"],
        queryFn: async () => {
            const { count: totalUsers } = await supabase
                .from("profiles")
                .select("id", { count: "exact", head: true });

            const { count: totalPosts } = await supabase
                .from("posts")
                .select("id", { count: "exact", head: true });

            const { count: totalComments } = await supabase
                .from("comments")
                .select("id", { count: "exact", head: true });

            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const { data: recentSignups } = await supabase
                .from("profiles")
                .select("id, username, display_name, created_at")
                .gte("created_at", sevenDaysAgo)
                .order("created_at", { ascending: false })
                .limit(50);

            const { data: activeUsers, error: activeErr } = await supabase.rpc("get_most_active_users", {
                result_limit: 20,
            });

            let mostActiveUsers: AnalyticsData["mostActiveUsers"] = [];
            if (activeErr) {
                const { data: users } = await supabase
                    .from("profiles")
                    .select("id, username, display_name")
                    .order("created_at", { ascending: false })
                    .limit(20);
                mostActiveUsers = (users || []).map((u: { id: string; username: string; display_name: string | null }) => ({
                    ...u,
                    post_count: 0,
                    comment_count: 0,
                }));
            } else {
                mostActiveUsers = (activeUsers || []) as AnalyticsData["mostActiveUsers"];
            }

            return {
                totalUsers: totalUsers ?? 0,
                totalPosts: totalPosts ?? 0,
                totalComments: totalComments ?? 0,
                recentSignups: recentSignups || [],
                mostActiveUsers,
            };
        },
        enabled: isAdmin,
    });

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

    const totalActivity = (analytics?.totalPosts ?? 0) + (analytics?.totalComments ?? 0);

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                    <p className="text-muted-foreground">Platform metrics, activity, and user insights</p>
                </div>
            </div>

            {isLoading && !analytics ? (
                <SkeletonCards />
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Total Users
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{analytics?.totalUsers ?? 0}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Total Posts
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{analytics?.totalPosts ?? 0}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Total Comments
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{analytics?.totalComments ?? 0}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Total Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{totalActivity}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card className="border-royal-purple/20 bg-card/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <UserPlus className="h-5 w-5" />
                                    Recent Signups (7 days)
                                </CardTitle>
                                <CardDescription>
                                    New users who joined in the last week
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {analytics?.recentSignups && analytics.recentSignups.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>Joined</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {analytics.recentSignups.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium text-sm">
                                                                {user.display_name || user.username}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                @{user.username}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {new Date(user.created_at).toLocaleDateString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="text-center py-8 text-muted-foreground">No recent signups</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-royal-purple/20 bg-card/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Most Active Users
                                </CardTitle>
                                <CardDescription>
                                    Users with the highest combined post + comment activity
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {analytics?.mostActiveUsers && analytics.mostActiveUsers.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>Posts</TableHead>
                                                <TableHead>Comments</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {analytics.mostActiveUsers.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium text-sm">
                                                                {user.display_name || user.username}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                @{user.username}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">{user.post_count}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">{user.comment_count}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="text-center py-8 text-muted-foreground">No activity data</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
