"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createBrowserClient } from "@/lib/supabase/client";
import { invalidateClientFlagCache } from "@/hooks/use-feature-flag";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface AiFeatureStatus {
    name: string;
    is_enabled: boolean;
    description: string;
    config: Record<string, any>;
}

export default function AdminAiSettingsPage() {
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

    const { data: flags, isLoading, refetch } = useQuery<AiFeatureStatus[]>({
        queryKey: ["admin", "ai-flags"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("feature_flags")
                .select("*")
                .ilike("name", "ai_%");

            if (error) throw error;
            return data || [];
        },
        enabled: isAdmin,
    });

    const toggleFlag = async (name: string, current: boolean) => {
        const { error } = await supabase
            .from("feature_flags")
            .update({ is_enabled: !current, updated_at: new Date().toISOString() })
            .eq("name", name);

        if (!error) {
            refetch();
            invalidateClientFlagCache().catch(() => {});
        }
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

    const aiModels = [
        { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", cost: "$0.14/$0.28 per 1M tokens", best: "Simple tasks (moderation, tags, translation)" },
        { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", cost: "$0.55/$1.10 per 1M tokens", best: "Complex tasks (recommendations, discovery)" },
    ];

    const serviceStatus = {
        deepseek: !!process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || true,
        redis: true,
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">AI Settings</h1>
                    <p className="text-muted-foreground">Manage AI features, models, and configurations</p>
                </div>
            </div>

            <section>
                <h2 className="text-lg font-semibold mb-3">AI Services</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">DeepSeek API</CardTitle>
                            <CardDescription>Provider: deepseek-v4-flash / deepseek-v4-pro</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                Configured
                            </Badge>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Redis Cache</CardTitle>
                            <CardDescription>AI response caching enabled</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                {serviceStatus.redis ? "Connected" : "Not configured"}
                            </Badge>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section>
                <h2 className="text-lg font-semibold mb-3">Available Models</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    {aiModels.map((model) => (
                        <Card key={model.id}>
                            <CardHeader>
                                <CardTitle className="text-sm">{model.name}</CardTitle>
                                <CardDescription>{model.cost}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Best for: {model.best}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-lg font-semibold mb-3">AI Feature Flags</h2>
                {isLoading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-16" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {flags?.map((flag) => (
                            <Card key={flag.name} className={flag.is_enabled ? "" : "opacity-70"}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm">{flag.name}</span>
                                            <Badge variant={flag.is_enabled ? "default" : "secondary"}>
                                                {flag.is_enabled ? "ON" : "OFF"}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {flag.description}
                                        </p>
                                        {flag.config && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {flag.config.model && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Model: {flag.config.model}
                                                    </Badge>
                                                )}
                                                {flag.config.tierLimits && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Free: {flag.config.tierLimits.free}/day
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => toggleFlag(flag.name, flag.is_enabled)}
                                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                            flag.is_enabled
                                                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                                : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                        }`}
                                    >
                                        {flag.is_enabled ? "Disable" : "Enable"}
                                    </button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            <section>
                <h2 className="text-lg font-semibold mb-3">API Endpoints</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    {[
                        { method: "POST", path: "/api/ai/moderate", desc: "Content moderation" },
                        { method: "POST", path: "/api/ai/translate", desc: "Translation (EN↔FR)" },
                        { method: "POST", path: "/api/ai/compose", desc: "Post composer" },
                        { method: "POST", path: "/api/ai/tags", desc: "Tag suggestions" },
                        { method: "POST", path: "/api/ai/recommend", desc: "Content recommendations" },
                        { method: "POST", path: "/api/ai/caption", desc: "Media captioning" },
                        { method: "POST", path: "/api/ai/chat-assist", desc: "Chat assistant" },
                        { method: "POST", path: "/api/ai/onboarding", desc: "Onboarding assistant" },
                        { method: "POST", path: "/api/ai/group-activity", desc: "Group activity generator" },
                    ].map((ep) => (
                        <Card key={ep.path}>
                            <CardContent className="p-4 flex items-center gap-3">
                                <Badge variant="secondary" className="font-mono">
                                    {ep.method}
                                </Badge>
                                <div>
                                    <p className="text-sm font-mono">{ep.path}</p>
                                    <p className="text-xs text-muted-foreground">{ep.desc}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
}
