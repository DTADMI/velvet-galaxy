"use client";

import {Building2, User} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import type React from "react";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {createClient} from "@/lib/supabase/client";

export default function SignUpPage() {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
    const [accountType, setAccountType] = useState<"personal" | "organization">("personal");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        const supabase = createClient();
        setIsLoading(true);
        setError(null);

        if (password !== repeatPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        try {
            const {error} = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/feed`,
                    data: {
                        username,
                        display_name: username,
                        account_type: accountType,
                    },
                },
            });
            if (error) {
                throw error;
            }
            router.push("/auth/sign-up-success");
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-6">
            <div className="w-full max-w-sm">
                <Card className="border-royal-blue/20">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <div
                                className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-royal-auburn via-royal-purple to-royal-blue shadow-lg shadow-royal-purple/30">
                                <span className="text-3xl font-bold text-white">L</span>
                            </div>
                        </div>
                        <CardTitle className="text-2xl">Create Account</CardTitle>
                        <CardDescription>Join LinkNet community today</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSignUp}>
                            <div className="flex flex-col gap-6">
                                <div className="space-y-3">
                                    <Label>Account Type</Label>
                                    <RadioGroup value={accountType} onValueChange={(v) => setAccountType(v as any)}>
                                        <div
                                            className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                                            <RadioGroupItem value="personal" id="personal"/>
                                            <Label htmlFor="personal"
                                                   className="flex items-center gap-2 cursor-pointer flex-1">
                                                <User className="h-4 w-4 text-royal-purple"/>
                                                <div>
                                                    <div className="font-medium">Personal</div>
                                                    <div className="text-xs text-muted-foreground">For individual
                                                        users
                                                    </div>
                                                </div>
                                            </Label>
                                        </div>
                                        <div
                                            className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                                            <RadioGroupItem value="organization" id="organization"/>
                                            <Label htmlFor="organization"
                                                   className="flex items-center gap-2 cursor-pointer flex-1">
                                                <Building2 className="h-4 w-4 text-royal-blue"/>
                                                <div>
                                                    <div className="font-medium">Organization</div>
                                                    <div className="text-xs text-muted-foreground">For houses,
                                                        companies, groups
                                                    </div>
                                                </div>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                                {/* End of added account type selection */}

                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="username">{accountType === "organization" ? "Organization Name" : "Username"}</Label>
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder={accountType === "organization" ? "Your Organization" : "your_username"}
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
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
                                <div className="grid gap-2">
                                    <Label htmlFor="repeat-password">Confirm Password</Label>
                                    <Input
                                        id="repeat-password"
                                        type="password"
                                        required
                                        value={repeatPassword}
                                        onChange={(e) => setRepeatPassword(e.target.value)}
                                    />
                                </div>
                                {error && <p className="text-sm text-red-500">{error}</p>}
                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-royal-auburn to-royal-purple hover:from-royal-auburn-dark hover:to-royal-purple-dark"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Creating account..." : "Sign Up"}
                                </Button>
                            </div>
                            <div className="mt-4 text-center text-sm">
                                Already have an account?{" "}
                                <Link
                                    href="/auth/login"
                                    className="text-royal-purple underline underline-offset-4 hover:text-royal-purple-light"
                                >
                                    Sign in
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
