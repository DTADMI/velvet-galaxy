"use client";

import {AlertCircle} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import type React from "react";
import {useEffect, useState} from "react";

import {Alert, AlertDescription} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {createClient} from "@/lib/supabase/client";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [existingUser, setExistingUser] = useState<{ email: string; displayName: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        checkExistingSession();
    }, []);

    const checkExistingSession = async () => {
        const supabase = createClient();
        const {
            data: {user},
        } = await supabase.auth.getUser();

        if (user) {
            const {data: profile} = await supabase.from("profiles").select("display_name").eq("id", user.id).single();

            setExistingUser({
                email: user.email || "",
                displayName: profile?.display_name || user.email || "User",
            });
        }
    };

    const handleSwitchAccount = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setExistingUser(null);
    };

    const handleContinue = () => {
        router.push("/feed");
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const supabase = createClient();
        setIsLoading(true);
        setError(null);

        try {
            const {error} = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                throw error;
            }
            router.push("/feed");
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    if (existingUser) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    <Card className="border-royal-blue/20">
                        <CardHeader>
                            <div className="flex justify-center mb-4">
                                <div
                                    className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-royal-auburn via-royal-purple to-royal-blue shadow-lg shadow-royal-purple/30">
                                    <span className="text-3xl font-bold text-white">S</span>
                                </div>
                            </div>
                            <CardTitle className="text-2xl">Already Logged In</CardTitle>
                            <CardDescription>You are currently signed in as {existingUser.displayName}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert className="border-royal-blue/20 bg-royal-blue/10">
                                <AlertCircle className="h-4 w-4 text-royal-blue"/>
                                <AlertDescription className="text-sm">
                                    You are already logged in. Continue to your feed or switch to a different account.
                                </AlertDescription>
                            </Alert>
                            <Button onClick={handleContinue}
                                    className="w-full bg-gradient-to-r from-royal-auburn to-royal-purple">
                                Continue to Feed
                            </Button>
                            <Button onClick={handleSwitchAccount} variant="outline" className="w-full bg-transparent">
                                Switch Account
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-6">
            <div className="w-full max-w-sm">
                <Card className="border-royal-blue/20">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <div
                                className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-royal-auburn via-royal-purple to-royal-blue shadow-lg shadow-royal-purple/30">
                                <span className="text-3xl font-bold text-white">S</span>
                            </div>
                        </div>
                        <CardTitle className="text-2xl">Welcome Back</CardTitle>
                        <CardDescription>Sign in to your account to continue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin}>
                            <div className="flex flex-col gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                {error && <p className="text-sm text-red-500">{error}</p>}
                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-royal-auburn to-royal-purple hover:from-royal-auburn-dark hover:to-royal-purple-dark"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Signing in..." : "Sign In"}
                                </Button>
                            </div>
                            <div className="mt-4 text-center text-sm">
                                Don&apos;t have an account?{" "}
                                <Link
                                    href="/auth/sign-up"
                                    className="text-royal-purple underline underline-offset-4 hover:text-royal-purple-light"
                                >
                                    Sign up
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
