"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface HealthData {
    timestamp: number;
    services: {
        database: { status: string; latencyMs?: number; error?: string };
        redis: { status: string; latencyMs?: number; error?: string };
        neo4j: { status: string; nodeCount?: number; relationshipCount?: number; error?: string };
        stripe: { status: string };
        ai: { status: string };
        email: { status: string };
    };
    stats: {
        totalUsers: number;
        totalPosts: number;
        totalGroups: number;
        totalEvents: number;
        activeUsers24h: number;
    };
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        healthy: "bg-green-500/10 text-green-500 border-green-500/20",
        degraded: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        down: "bg-red-500/10 text-red-500 border-red-500/20",
        configured: "bg-green-500/10 text-green-500 border-green-500/20",
        not_configured: "bg-muted text-muted-foreground",
    };

    return (
        <Badge variant="outline" className={colors[status] || ""}>
            {status.replace(/_/g, " ")}
        </Badge>
    );
}

export default function AdminHealthPage() {
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

    const { data: health, isLoading, error, refetch } = useQuery<HealthData>({
        queryKey: ["admin", "health"],
        queryFn: async () => {
            const res = await fetch("/api/admin/health");
            if (!res.ok) throw new Error("Failed to fetch health data");
            return res.json();
        },
        enabled: isAdmin,
        refetchInterval: 30_000,
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

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">System Health</h1>
                    <p className="text-muted-foreground">Monitor service status and platform statistics</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="text-sm text-muted-foreground hover:text-foreground"
                >
                    Refresh
                </button>
            </div>

            {isLoading && !health && (
                <div className="grid gap-4 md:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            )}

            {error && (
                <Card className="border-red-500/20">
                    <CardContent className="p-4 text-red-500">
                        Failed to load health data. Please try again.
                    </CardContent>
                </Card>
            )}

            {health && (
                <>
                    <section>
                        <h2 className="text-lg font-semibold mb-3">Services</h2>
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center justify-between">
                                        Database
                                        <StatusBadge status={health.services.database.status} />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">
                                        {health.services.database.latencyMs}ms
                                    </p>
                                    <p className="text-xs text-muted-foreground">Latency</p>
                                    {health.services.database.error && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {health.services.database.error}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center justify-between">
                                        Redis
                                        <StatusBadge status={health.services.redis.status} />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {health.services.redis.status === "not_configured" ? (
                                        <p className="text-sm text-muted-foreground">Not configured</p>
                                    ) : (
                                        <>
                                            <p className="text-2xl font-bold">
                                                {health.services.redis.latencyMs ?? "--"}ms
                                            </p>
                                            <p className="text-xs text-muted-foreground">Latency</p>
                                        </>
                                    )}
                                    {health.services.redis.error && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {health.services.redis.error}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center justify-between">
                                        Neo4j
                                        <StatusBadge status={health.services.neo4j.status} />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {health.services.neo4j.status === "not_configured" ? (
                                        <p className="text-sm text-muted-foreground">Not configured</p>
                                    ) : (
                                        <>
                                            <p className="text-sm">
                                                {health.services.neo4j.nodeCount ?? "--"} nodes
                                            </p>
                                            <p className="text-sm">
                                                {health.services.neo4j.relationshipCount ?? "--"} relationships
                                            </p>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center justify-between">
                                        Stripe
                                        <StatusBadge status={health.services.stripe.status} />
                                    </CardTitle>
                                </CardHeader>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center justify-between">
                                        AI (DeepSeek)
                                        <StatusBadge status={health.services.ai.status} />
                                    </CardTitle>
                                </CardHeader>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center justify-between">
                                        Email (Resend)
                                        <StatusBadge status={health.services.email.status} />
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-3">Platform Stats</h2>
                        <div className="grid gap-4 md:grid-cols-5">
                            {[
                                { label: "Total Users", value: health.stats.totalUsers },
                                { label: "Total Posts", value: health.stats.totalPosts },
                                { label: "Groups", value: health.stats.totalGroups },
                                { label: "Events", value: health.stats.totalEvents },
                                { label: "Active (24h)", value: health.stats.activeUsers24h },
                            ].map((stat) => (
                                <Card key={stat.label}>
                                    <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    <p className="text-xs text-muted-foreground">
                        Last updated: {new Date(health.timestamp).toLocaleString()}
                    </p>
                </>
            )}
        </div>
    );
}
