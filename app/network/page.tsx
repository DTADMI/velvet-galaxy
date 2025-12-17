import {Lock, Sparkles} from "lucide-react";
import Link from "next/link";
import {redirect} from "next/navigation";

import {checkSubscriptionStatus} from "@/app/actions/stripe";
import {Navigation} from "@/components/navigation";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {createServerClient} from "@/lib/supabase/server";

import {NetworkVisualization} from "./network-visualization";

export default async function NetworkPage() {
    const supabase = await createServerClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const {isPremium} = await checkSubscriptionStatus();

    if (!isPremium) {
        return (
            <div className="min-h-screen bg-background pt-20 flex items-center justify-center p-4">
                <Navigation/>
                <Card className="max-w-2xl w-full border-royal-purple/20">
                    <CardHeader className="text-center">
                        <div
                            className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-royal-purple to-royal-blue flex items-center justify-center mb-4">
                            <Lock className="h-8 w-8 text-white"/>
                        </div>
                        <CardTitle className="text-2xl">Premium Feature</CardTitle>
                        <CardDescription>The 3D Network Visualization is a premium feature</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div
                            className="bg-gradient-to-br from-royal-purple/10 to-royal-blue/10 rounded-lg p-6 space-y-3">
                            <div className="flex items-start gap-3">
                                <Sparkles className="h-5 w-5 text-royal-purple mt-0.5"/>
                                <div>
                                    <h4 className="font-semibold mb-1">Interactive 3D Visualization</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Explore your social network in stunning 3D with interactive nodes and
                                        connections
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Sparkles className="h-5 w-5 text-royal-purple mt-0.5"/>
                                <div>
                                    <h4 className="font-semibold mb-1">Relationship Insights</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Discover hidden connections and understand your network structure
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Sparkles className="h-5 w-5 text-royal-purple mt-0.5"/>
                                <div>
                                    <h4 className="font-semibold mb-1">Advanced Controls</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Zoom, rotate, and filter your network with intuitive controls
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button asChild className="w-full bg-gradient-to-r from-royal-purple to-royal-blue">
                            <Link href="/subscribe">Upgrade to Premium</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full bg-transparent">
                            <Link href="/network/2d">View 2D Network Map (Free)</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pt-20 flex items-center justify-center p-4">
            <Navigation/>
            <NetworkVisualization userId={user.id}/>
        </div>
    );
}
