import {Heart, Shield, Users, Zap} from "lucide-react";

import {LinkNetLogo} from "@/components/linknet-logo";
import {Navigation} from "@/components/navigation";
import {Card, CardContent} from "@/components/ui/card";

export default function AboutPage() {
    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="mb-12 text-center">
                        <div className="flex justify-center mb-6">
                            <LinkNetLogo size="xl"/>
                        </div>
                        <h1 className="text-4xl font-bold text-gradient mb-4">About LinkNet</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            LinkNet is a vibrant social platform designed to connect people through shared interests,
                            meaningful
                            conversations, and local communities.
                        </p>
                        {/* </CHANGE> */}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-12">
                        {[
                            {
                                icon: Users,
                                title: "Community First",
                                description:
                                    "We believe in building authentic connections. Join groups, attend events, and engage with like-minded individuals.",
                                color: "from-royal-blue to-blue-600",
                            },
                            {
                                icon: Heart,
                                title: "Meaningful Connections",
                                description:
                                    "Whether you're looking for friendship, dating, or professional networking, LinkNet provides the tools to connect meaningfully.",
                                color: "from-royal-orange to-amber-600",
                            },
                            {
                                icon: Shield,
                                title: "Privacy & Safety",
                                description:
                                    "Your privacy matters. We implement robust security measures and give you full control over your data and visibility.",
                                color: "from-royal-green to-emerald-600",
                            },
                            {
                                icon: Zap,
                                title: "Feature Rich",
                                description:
                                    "From multimedia sharing to chat rooms, events to marketplace - everything you need in one platform.",
                                color: "from-royal-purple to-purple-600",
                            },
                        ].map((feature, i) => (
                            <Card key={i}
                                  className="border-royal-purple/20 bg-card/50 hover:border-royal-purple/40 transition-all">
                                <CardContent className="pt-6">
                                    <div
                                        className={`h-12 w-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}
                                    >
                                        <feature.icon className="h-6 w-6 text-white"/>
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card className="border-royal-purple/20 bg-gradient-to-br from-card to-card/50">
                        <CardContent className="pt-6">
                            <h2 className="text-2xl font-bold text-gradient mb-4">Our Mission</h2>
                            <p className="text-muted-foreground leading-relaxed mb-4">
                                At LinkNet, we're on a mission to create a social platform that prioritizes genuine
                                human connection
                                over algorithms and engagement metrics. We believe that the best online communities are
                                built on trust,
                                respect, and shared interests.
                                {/* </CHANGE> */}
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                Whether you're sharing your creative work, organizing local events, buying and selling
                                with neighbors,
                                or simply chatting with friends, LinkNet provides the tools and space to make it happen
                                - all while
                                keeping your data secure and your experience personalized.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}
