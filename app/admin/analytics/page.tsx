"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Users, MessageSquare, FileText, TrendingUp, UserPlus,
    Activity, BarChart3, PieChart, Image, Video as VideoIcon
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart as RPieChart, Pie, Cell, Legend
} from "recharts";

interface UserGrowthPoint {
    date: string;
    count: number;
}

interface PostActivityPoint {
    date: string;
    posts: number;
    comments: number;
}

interface ContentBreakdown {
    name: string;
    value: number;
    color: string;
    [key: string]: string | number;
}

interface EngagementData {
    totalLikes: number;
    totalComments: number;
    totalReports: number;
    avgLikesPerPost: number;
    avgCommentsPerPost: number;
}

interface AnalyticsData {
    totalUsers: number;
    totalPosts: number;
    totalComments: number;
    totalGroups: number;
    totalEvents: number;
    totalSubscriptions: number;
    recentSignups: {
        id: string;
        username: string;
        display_name: string | null;
        created_at: string;
    }[];
    mostActiveUsers: {
        id: string;
        username: string;
        display_name: string | null;
        post_count: number;
        comment_count: number;
    }[];
    userGrowth: UserGrowthPoint[];
    postActivity: PostActivityPoint[];
    contentBreakdown: ContentBreakdown[];
    engagement: EngagementData;
}

const COLORS = ["#8b5cf6", "#ec4899", "#06b6d4", "#f59e0b", "#10b981", "#ef4444"];

function SkeletonCards({ count = 4 }: { count?: number }) {
    return (
        <div className={`grid gap-4 md:grid-cols-${Math.min(count, 4)}`}>
            {Array.from({ length: count }).map((_, i) => (
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
        queryKey: ["admin", "analytics", "enhanced"],
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

            const { count: totalGroups } = await supabase
                .from("groups")
                .select("id", { count: "exact", head: true });

            const { count: totalEvents } = await supabase
                .from("events")
                .select("id", { count: "exact", head: true });

            const { count: totalSubscriptions } = await supabase
                .from("subscriptions")
                .select("id", { count: "exact", head: true });

            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const { data: recentSignups } = await supabase
                .from("profiles")
                .select("id, username, display_name, created_at")
                .gte("created_at", sevenDaysAgo)
                .order("created_at", { ascending: false })
                .limit(50);

            const { data: activeUsers, error: activeErr } = await supabase.rpc(
                "get_most_active_users",
                { result_limit: 20 }
            );

            let mostActiveUsers: AnalyticsData["mostActiveUsers"] = [];
            if (activeErr) {
                const { data: users } = await supabase
                    .from("profiles")
                    .select("id, username, display_name")
                    .order("created_at", { ascending: false })
                    .limit(20);
                mostActiveUsers = (users || []).map(
                    (u: { id: string; username: string; display_name: string | null }) => ({
                        ...u,
                        post_count: 0,
                        comment_count: 0,
                    })
                );
            } else {
                mostActiveUsers = (activeUsers || []) as AnalyticsData["mostActiveUsers"];
            }

            const userGrowth: UserGrowthPoint[] = [];
            for (let i = 29; i >= 0; i--) {
                const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
                const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
                const { count } = await supabase
                    .from("profiles")
                    .select("id", { count: "exact", head: true })
                    .lte("created_at", dayEnd);
                userGrowth.push({
                    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                    count: count ?? 0,
                });
            }

            const postActivity: PostActivityPoint[] = [];
            for (let i = 13; i >= 0; i--) {
                const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
                const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();

                const [{ count: posts }, { count: comments }] = await Promise.all([
                    supabase
                        .from("posts")
                        .select("id", { count: "exact", head: true })
                        .gte("created_at", dayStart)
                        .lt("created_at", dayEnd),
                    supabase
                        .from("comments")
                        .select("id", { count: "exact", head: true })
                        .gte("created_at", dayStart)
                        .lt("created_at", dayEnd),
                ]);

                postActivity.push({
                    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                    posts: posts ?? 0,
                    comments: comments ?? 0,
                });
            }

            const { data: mediaBreakdown } = await supabase
                .from("media")
                .select("type");

            const typeCounts: Record<string, number> = {};
            (mediaBreakdown || []).forEach((m: any) => {
                const t = m.type || "other";
                typeCounts[t] = (typeCounts[t] || 0) + 1;
            });

            const contentBreakdown: ContentBreakdown[] = Object.entries(typeCounts).map(
                ([type, count], i) => ({
                    name: type.charAt(0).toUpperCase() + type.slice(1),
                    value: count,
                    color: COLORS[i % COLORS.length],
                })
            );

            let engagement: EngagementData = {
                totalLikes: 0,
                totalComments: 0,
                totalReports: 0,
                avgLikesPerPost: 0,
                avgCommentsPerPost: 0,
            };

            try {
                const { count: totalLikes } = await supabase
                    .from("likes")
                    .select("id", { count: "exact", head: true });
                const { count: totalReports } = await supabase
                    .from("reports")
                    .select("id", { count: "exact", head: true });

                engagement = {
                    totalLikes: totalLikes ?? 0,
                    totalComments: totalComments ?? 0,
                    totalReports: totalReports ?? 0,
                    avgLikesPerPost: (totalUsers ?? 0) > 0 ? ((totalLikes ?? 0) / (totalPosts ?? 1)).toFixed(1) as any : 0,
                    avgCommentsPerPost: (totalPosts ?? 0) > 0 ? ((totalComments ?? 0) / (totalPosts ?? 1)).toFixed(1) as any : 0,
                };
            } catch {}

            return {
                totalUsers: totalUsers ?? 0,
                totalPosts: totalPosts ?? 0,
                totalComments: totalComments ?? 0,
                totalGroups: totalGroups ?? 0,
                totalEvents: totalEvents ?? 0,
                totalSubscriptions: totalSubscriptions ?? 0,
                recentSignups: recentSignups || [],
                mostActiveUsers,
                userGrowth,
                postActivity,
                contentBreakdown,
                engagement,
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
                    <p className="text-muted-foreground">Platform metrics, trends, and user insights</p>
                </div>
            </div>

            {isLoading && !analytics ? (
                <SkeletonCards count={5} />
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Activity className="h-4 w-4" />
                                    Subscriptions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{analytics?.totalSubscriptions ?? 0}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="trends" className="w-full">
                        <TabsList className="bg-background/50 border border-royal-purple/20">
                            <TabsTrigger value="trends" className="gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Trends
                            </TabsTrigger>
                            <TabsTrigger value="engagement" className="gap-2">
                                <Activity className="h-4 w-4" />
                                Engagement
                            </TabsTrigger>
                            <TabsTrigger value="users" className="gap-2">
                                <UserPlus className="h-4 w-4" />
                                Users
                            </TabsTrigger>
                            <TabsTrigger value="content" className="gap-2">
                                <PieChart className="h-4 w-4" />
                                Content
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="trends" className="mt-6 space-y-6">
                            <Card className="border-royal-purple/20 bg-card/50">
                                <CardHeader>
                                    <CardTitle>User Growth (30 days)</CardTitle>
                                    <CardDescription>Cumulative user registrations over time</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={analytics?.userGrowth || []}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                                            <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                                            <Tooltip />
                                            <Line
                                                type="monotone"
                                                dataKey="count"
                                                stroke="#8b5cf6"
                                                strokeWidth={2}
                                                dot={false}
                                                name="Total Users"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card className="border-royal-purple/20 bg-card/50">
                                <CardHeader>
                                    <CardTitle>Post & Comment Activity (14 days)</CardTitle>
                                    <CardDescription>Daily posts and comments created</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={analytics?.postActivity || []}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                                            <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                                            <Tooltip />
                                            <Bar dataKey="posts" fill="#8b5cf6" name="Posts" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="comments" fill="#ec4899" name="Comments" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="engagement" className="mt-6 space-y-6">
                            <div className="grid gap-4 md:grid-cols-4">
                                {analytics?.engagement && [
                                    { label: "Total Likes", value: analytics.engagement.totalLikes, icon: TrendingUp },
                                    { label: "Total Comments", value: analytics.engagement.totalComments, icon: MessageSquare },
                                    { label: "Total Reports", value: analytics.engagement.totalReports, icon: Activity },
                                    { label: "Avg Likes/Post", value: analytics.engagement.avgLikesPerPost, icon: BarChart3 },
                                ].map((stat) => (
                                    <Card key={stat.label}>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                                <stat.icon className="h-4 w-4" />
                                                {stat.label}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-2xl font-bold">{stat.value}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <div className="grid gap-6 lg:grid-cols-2">
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
                            </div>
                        </TabsContent>

                        <TabsContent value="users" className="mt-6">
                            <Card className="border-royal-purple/20 bg-card/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <UserPlus className="h-5 w-5" />
                                        Recent Signups (7 days)
                                    </CardTitle>
                                    <CardDescription>New users who joined in the last week</CardDescription>
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
                        </TabsContent>

                        <TabsContent value="content" className="mt-6 space-y-6">
                            <Card className="border-royal-purple/20 bg-card/50">
                                <CardHeader>
                                    <CardTitle>Content Type Distribution</CardTitle>
                                    <CardDescription>Breakdown of uploaded media by type</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {analytics?.contentBreakdown && analytics.contentBreakdown.length > 0 ? (
                                        <div className="flex flex-col lg:flex-row items-center gap-8">
                                            <ResponsiveContainer width={300} height={300}>
                                                <RPieChart>
                                                    <Pie
                                                        data={analytics.contentBreakdown}
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={100}
                                                        dataKey="value"
                                                        label={({ name, percent }: any) =>
                                                            `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`
                                                        }
                                                    >
                                                        {analytics.contentBreakdown.map((entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={entry.color}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </RPieChart>
                                            </ResponsiveContainer>
                                            <div className="space-y-2">
                                                {analytics.contentBreakdown.map((item) => (
                                                    <div key={item.name} className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: item.color }}
                                                        />
                                                        <span className="text-sm">
                                                            {item.name}: {item.value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-center py-8 text-muted-foreground">No media content yet</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    );
}
