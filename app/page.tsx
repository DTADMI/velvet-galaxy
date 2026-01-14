import Link from "next/link";
import {redirect} from "next/navigation";
import {Globe, Heart, Lock, MessageCircle, Palette, Shield, Sparkles, Users} from "lucide-react";

import {AuthNavigation} from "@/components/auth-navigation";
import {Footer} from "@/components/footer";
import {VelvetLogo} from "@/components/velvet-logo";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
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
        <>
            <AuthNavigation/>
            <main className="min-h-screen bg-background">
                {/* Hero Section */}
                <section
                    className="pt-32 pb-20 px-6 bg-gradient-to-br from-royal-auburn/10 via-royal-purple/10 to-royal-blue/10">
                    <div className="container mx-auto max-w-6xl">
                        <div className="text-center space-y-8">
                            <div className="flex justify-center">
                                <VelvetLogo size="xl"/>
                            </div>
                            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-royal-auburn via-royal-purple to-royal-blue bg-clip-text text-transparent">
                                Welcome to Velvet Galaxy
                            </h1>
                            <p className="text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                                Your space to connect, explore, and curate the experience you desire. Whether seeking
                                friendships, romance, lifestyle communities, or intimate connections—this is your galaxy
                                to explore.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                                <Button
                                    asChild
                                    size="lg"
                                    className="bg-gradient-to-r from-royal-auburn to-royal-purple hover:from-royal-auburn-dark hover:to-royal-purple-dark text-white shadow-lg shadow-royal-purple/30 text-lg h-14 px-8"
                                >
                                    <Link href="/auth/sign-up">Enter the Galaxy - Free</Link>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="border-royal-purple text-royal-purple hover:bg-royal-purple hover:text-white text-lg h-14 px-8"
                                >
                                    <Link href="/auth/login">Log In</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Curate Your Experience Section */}
                <section className="py-20 px-6">
                    <div className="container mx-auto max-w-6xl">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
                                Curate Your Experience
                            </h2>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                Velvet Galaxy adapts to your desires. Choose the connections and communities that matter
                                to you.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card
                                className="border-royal-blue/30 bg-gradient-to-br from-royal-blue/10 to-transparent hover:border-royal-blue/50 transition-all">
                                <CardContent className="p-6 space-y-4">
                                    <div
                                        className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-royal-blue to-blue-600">
                                        <Users className="h-6 w-6 text-white"/>
                                    </div>
                                    <h3 className="font-semibold text-xl text-foreground">Friendships</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Build genuine connections with like-minded people in your community
                                    </p>
                                </CardContent>
                            </Card>

                            <Card
                                className="border-pink-600/30 bg-gradient-to-br from-pink-600/10 to-transparent hover:border-pink-600/50 transition-all">
                                <CardContent className="p-6 space-y-4">
                                    <div
                                        className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-pink-600 to-red-600">
                                        <Heart className="h-6 w-6 text-white"/>
                                    </div>
                                    <h3 className="font-semibold text-xl text-foreground">Dating</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Find meaningful romantic connections with separate, dedicated messaging
                                    </p>
                                </CardContent>
                            </Card>

                            <Card
                                className="border-royal-purple/30 bg-gradient-to-br from-royal-purple/10 to-transparent hover:border-royal-purple/50 transition-all">
                                <CardContent className="p-6 space-y-4">
                                    <div
                                        className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-royal-purple to-purple-600">
                                        <Palette className="h-6 w-6 text-white"/>
                                    </div>
                                    <h3 className="font-semibold text-xl text-foreground">Lifestyle</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Explore alternative lifestyles and communities in a safe, judgment-free space
                                    </p>
                                </CardContent>
                            </Card>

                            <Card
                                className="border-royal-auburn/30 bg-gradient-to-br from-royal-auburn/10 to-transparent hover:border-royal-auburn/50 transition-all">
                                <CardContent className="p-6 space-y-4">
                                    <div
                                        className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-royal-auburn to-red-900">
                                        <Lock className="h-6 w-6 text-white"/>
                                    </div>
                                    <h3 className="font-semibold text-xl text-foreground">BDSM & Kink</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Connect with the kink community in a respectful, consensual environment
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 px-6 bg-gradient-to-br from-card/50 to-transparent">
                    <div className="container mx-auto max-w-6xl">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
                                Why Join Velvet Galaxy?
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <Card className="border-royal-green/30 hover:border-royal-green/50 transition-all">
                                <CardContent className="p-8 space-y-4">
                                    <div
                                        className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-royal-green to-emerald-600 mx-auto">
                                        <MessageCircle className="h-7 w-7 text-white"/>
                                    </div>
                                    <h3 className="font-semibold text-xl text-center">Smart Messaging</h3>
                                    <p className="text-muted-foreground text-center">
                                        Separate channels for platonic friendships, romantic connections, and group
                                        conversations. Keep your interactions organized and intentional.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-royal-orange/30 hover:border-royal-orange/50 transition-all">
                                <CardContent className="p-8 space-y-4">
                                    <div
                                        className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-royal-orange to-amber-600 mx-auto">
                                        <Shield className="h-7 w-7 text-white"/>
                                    </div>
                                    <h3 className="font-semibold text-xl text-center">Privacy First</h3>
                                    <p className="text-muted-foreground text-center">
                                        Control who sees your content with granular privacy settings. Share freely with
                                        friends-only posts or NSFW content warnings.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-royal-blue/30 hover:border-royal-blue/50 transition-all">
                                <CardContent className="p-8 space-y-4">
                                    <div
                                        className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-royal-blue to-blue-600 mx-auto">
                                        <Globe className="h-7 w-7 text-white"/>
                                    </div>
                                    <h3 className="font-semibold text-xl text-center">Local Community</h3>
                                    <p className="text-muted-foreground text-center">
                                        Connect with people nearby, attend local events, and trade items in your
                                        community marketplace.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-royal-purple/30 hover:border-royal-purple/50 transition-all">
                                <CardContent className="p-8 space-y-4">
                                    <div
                                        className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-royal-purple to-purple-600 mx-auto">
                                        <Users className="h-7 w-7 text-white"/>
                                    </div>
                                    <h3 className="font-semibold text-xl text-center">Groups & Events</h3>
                                    <p className="text-muted-foreground text-center">
                                        Join interest-based groups, discover local events, and participate in chat rooms
                                        with your communities.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-pink-600/30 hover:border-pink-600/50 transition-all">
                                <CardContent className="p-8 space-y-4">
                                    <div
                                        className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-pink-600 to-red-600 mx-auto">
                                        <Sparkles className="h-7 w-7 text-white"/>
                                    </div>
                                    <h3 className="font-semibold text-xl text-center">Rich Media</h3>
                                    <p className="text-muted-foreground text-center">
                                        Share photos, videos, audio, polls, and writings. Express yourself in multiple
                                        formats with beautiful galleries.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-royal-green/30 hover:border-royal-green/50 transition-all">
                                <CardContent className="p-8 space-y-4">
                                    <div
                                        className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-royal-green to-emerald-600 mx-auto">
                                        <Shield className="h-7 w-7 text-white"/>
                                    </div>
                                    <h3 className="font-semibold text-xl text-center">Safe & Respectful</h3>
                                    <p className="text-muted-foreground text-center">
                                        Comprehensive reporting system, content moderation, and community guidelines
                                        ensure everyone feels safe and respected.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-6">
                    <div className="container mx-auto max-w-4xl text-center space-y-8">
                        <h2 className="text-4xl md:text-5xl font-bold text-gradient">
                            Ready to Enter Your Galaxy?
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Join thousands of people already connecting, sharing, and exploring on Velvet Galaxy. Your
                            journey starts now—completely free.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Button
                                asChild
                                size="lg"
                                className="bg-gradient-to-r from-royal-auburn to-royal-purple hover:from-royal-auburn-dark hover:to-royal-purple-dark text-white shadow-lg shadow-royal-purple/30 text-lg h-14 px-8"
                            >
                                <Link href="/auth/sign-up">Enter the Galaxy - Free</Link>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="border-royal-purple text-royal-purple hover:bg-royal-purple hover:text-white text-lg h-14 px-8"
                            >
                                <Link href="/auth/login">Log In</Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>
            <Footer/>
        </>
    );
}
