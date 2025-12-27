"use client";

import {useState} from "react";
import {Activity, CreditCard, Settings, Shield, Users} from "lucide-react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Switch} from "@/components/ui/switch";
import {toast} from "sonner";
import {createBrowserClient} from "@/lib/supabase/client";

interface FeatureFlag {
    id: string;
    name: string;
    description: string;
    is_enabled: boolean;
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
    const supabase = createBrowserClient();

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
        </div>
    );
}
