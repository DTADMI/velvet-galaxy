"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Ban, Shield, UserCheck, UserX } from "lucide-react";

interface Profile {
    id: string;
    username: string;
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    is_admin: boolean;
    created_at: string;
}

export default function AdminUsersPage() {
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

    const { data: users, isLoading, refetch } = useQuery<Profile[]>({
        queryKey: ["admin", "users"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, username, display_name, bio, avatar_url, is_admin, created_at")
                .order("created_at", { ascending: false })
                .limit(200);

            if (error) throw error;
            return data || [];
        },
        enabled: isAdmin,
    });

    const toggleAdmin = async (userId: string, currentAdmin: boolean) => {
        const { error } = await supabase
            .from("profiles")
            .update({ is_admin: !currentAdmin, updated_at: new Date().toISOString() })
            .eq("id", userId);

        if (error) {
            toast.error("Failed to update user role");
        } else {
            toast.success(`User ${currentAdmin ? "demoted" : "promoted"} successfully`);
            refetch();
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

    const adminCount = users?.filter(u => u.is_admin).length ?? 0;
    const totalUsers = users?.length ?? 0;

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-muted-foreground">Manage users, roles, and account status</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{totalUsers}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Admins</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{adminCount}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Standard Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{totalUsers - adminCount}</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-royal-purple/20 bg-card/50">
                <CardHeader>
                    <CardTitle>User Directory</CardTitle>
                    <CardDescription>
                        View and manage platform users. Toggle admin privileges.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-12" />
                            ))}
                        </div>
                    ) : users && users.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {user.avatar_url && (
                                                    <img
                                                        src={user.avatar_url}
                                                        alt=""
                                                        className="w-8 h-8 rounded-full"
                                                    />
                                                )}
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {user.display_name || user.username}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        @{user.username}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.is_admin ? "default" : "secondary"}>
                                                {user.is_admin ? "Admin" : "User"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant={user.is_admin ? "destructive" : "default"}
                                                onClick={() => toggleAdmin(user.id, user.is_admin)}
                                            >
                                                {user.is_admin ? (
                                                    <>
                                                        <UserX className="h-4 w-4 mr-2" />
                                                        Demote
                                                    </>
                                                ) : (
                                                    <>
                                                        <Shield className="h-4 w-4 mr-2" />
                                                        Promote
                                                    </>
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center py-8 text-muted-foreground">No users found</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
