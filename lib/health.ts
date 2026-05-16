import "server-only";

import { createServerClient } from "@/lib/supabase/server";
import { getRedis, withRedis } from "@/lib/redis/client";
import { isNeo4jAvailable, getGraphStats } from "@/lib/neo4j";

export interface SystemHealth {
    timestamp: number;
    services: {
        database: { status: "healthy" | "degraded" | "down"; latencyMs: number; error?: string };
        redis: { status: "healthy" | "degraded" | "down" | "not_configured"; latencyMs?: number; memoryUsedMb?: number; error?: string };
        neo4j: { status: "healthy" | "degraded" | "down" | "not_configured"; nodeCount?: number; relationshipCount?: number; error?: string };
        stripe: { status: "configured" | "not_configured" };
        ai: { status: "configured" | "not_configured" };
        email: { status: "configured" | "not_configured" };
    };
    stats: {
        totalUsers: number;
        totalPosts: number;
        totalGroups: number;
        totalEvents: number;
        activeUsers24h: number;
    };
}

export async function getSystemHealth(): Promise<SystemHealth> {
    const now = Date.now();
    const supabase = await createServerClient();

    const dbStart = performance.now();
    let dbStatus: SystemHealth["services"]["database"] = { status: "healthy", latencyMs: 0 };

    try {
        const { data, error } = await supabase.from("profiles").select("id").limit(1);
        dbStatus.latencyMs = Math.round(performance.now() - dbStart);
        if (error) {
            dbStatus = { status: "degraded", latencyMs: dbStatus.latencyMs, error: error.message };
        }
    } catch (err: any) {
        dbStatus = { status: "down", latencyMs: Math.round(performance.now() - dbStart), error: err.message };
    }

    let redisStatus: SystemHealth["services"]["redis"] = { status: "not_configured" };
    const redis = getRedis();
    if (redis) {
        try {
            const redisStart = performance.now();
            await redis.ping();
            const redisLatency = Math.round(performance.now() - redisStart);
            redisStatus = { status: "healthy", latencyMs: redisLatency };
        } catch (err: any) {
            redisStatus = { status: "down", error: err.message };
        }
    }

    let neo4jStatus: SystemHealth["services"]["neo4j"] = { status: "not_configured" };
    if (process.env.NEO4J_URI) {
        try {
            const available = await isNeo4jAvailable();
            if (available) {
                const stats = await getGraphStats();
                neo4jStatus = {
                    status: "healthy",
                    nodeCount: stats.nodeCount,
                    relationshipCount: stats.relationshipCount,
                };
            } else {
                neo4jStatus = { status: "down", error: "Neo4j not reachable" };
            }
        } catch (err: any) {
            neo4jStatus = { status: "down", error: err.message };
        }
    }

    let totalUsers = 0;
    let totalPosts = 0;
    let totalGroups = 0;
    let totalEvents = 0;
    let activeUsers24h = 0;

    try {
        const [usersRes, postsRes, groupsRes, eventsRes, activeRes] = await Promise.all([
            supabase.from("profiles").select("*", { count: "exact", head: true }),
            supabase.from("posts").select("*", { count: "exact", head: true }),
            supabase.from("groups").select("*", { count: "exact", head: true }),
            supabase.from("events").select("*", { count: "exact", head: true }),
            supabase.from("posts")
                .select("author_id", { count: "exact", head: true })
                .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        ]);

        totalUsers = usersRes.count ?? 0;
        totalPosts = postsRes.count ?? 0;
        totalGroups = groupsRes.count ?? 0;
        totalEvents = eventsRes.count ?? 0;
        activeUsers24h = new Set(
            (activeRes.data as any[])?.map((p: any) => p.author_id) ?? []
        ).size;
    } catch {}

    return {
        timestamp: now,
        services: {
            database: dbStatus,
            redis: redisStatus,
            neo4j: neo4jStatus,
            stripe: {
                status: process.env.STRIPE_SECRET_KEY ? "configured" : "not_configured",
            },
            ai: {
                status: process.env.DEEPSEEK_API_KEY ? "configured" : "not_configured",
            },
            email: {
                status: process.env.RESEND_API_KEY ? "configured" : "not_configured",
            },
        },
        stats: {
            totalUsers,
            totalPosts,
            totalGroups,
            totalEvents,
            activeUsers24h,
        },
    };
}
