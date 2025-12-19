import Link from "next/link";
import {redirect} from "next/navigation";

import {LinkNetLogo} from "@/components/linknet-logo";
import {Button} from "@/components/ui/button";
import {createClient} from "@/lib/supabase/server";

export default async function HomePage() {
    const supabase = await createClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (user) {
        redirect("/feed");
    }

    return (
        <main className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="max-w-2xl w-full text-center space-y-8">
                <div className="space-y-4">
                    <div className="flex justify-center">
                        <LinkNetLogo size="xl"/>
                    </div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-royal-auburn via-royal-purple to-royal-blue bg-clip-text text-transparent">
                        Welcome to Velvet Galaxy
                    </h1>
                    {/* </CHANGE> */}
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        Connect with your community, share your experiences, and explore a world of possibilities. Join
                        conversations, find local items, and build meaningful connections.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        asChild
                        size="lg"
                        className="bg-gradient-to-r from-royal-auburn to-royal-purple hover:from-royal-auburn-dark hover:to-royal-purple-dark text-white shadow-lg shadow-royal-purple/30"
                    >
                        <Link href="/auth/sign-up">Get Started</Link>
                    </Button>
                    <Button
                        asChild
                        size="lg"
                        variant="outline"
                        className="border-royal-blue text-royal-blue hover:bg-royal-blue hover:text-white bg-transparent"
                    >
                        <Link href="/auth/login">Sign In</Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
                    <div
                        className="space-y-2 p-4 rounded-lg border border-royal-blue/30 bg-gradient-to-br from-royal-blue/10 to-transparent hover:border-royal-blue/50 transition-colors">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-royal-blue to-royal-purple mx-auto shadow-md">
                            <span className="text-2xl">💬</span>
                        </div>
                        <h3 className="font-semibold text-foreground">Smart Messaging</h3>
                        <p className="text-sm text-muted-foreground">
                            Separate channels for normal chats, dating, and group conversations
                        </p>
                    </div>
                    <div
                        className="space-y-2 p-4 rounded-lg border border-royal-green/30 bg-gradient-to-br from-royal-green/10 to-transparent hover:border-royal-green/50 transition-colors">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-royal-green to-royal-blue mx-auto shadow-md">
                            <span className="text-2xl">🛍️</span>
                        </div>
                        <h3 className="font-semibold text-foreground">Local Marketplace</h3>
                        <p className="text-sm text-muted-foreground">Buy and sell items with peers in your local
                            community</p>
                    </div>
                    <div
                        className="space-y-2 p-4 rounded-lg border border-royal-orange/30 bg-gradient-to-br from-royal-orange/10 to-transparent hover:border-royal-orange/50 transition-colors">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-royal-orange to-yellow mx-auto shadow-md">
                            <span className="text-2xl">👥</span>
                        </div>
                        <h3 className="font-semibold text-foreground">Community Feed</h3>
                        <p className="text-sm text-muted-foreground">
                            Share updates, photos, and connect with like-minded individuals
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
