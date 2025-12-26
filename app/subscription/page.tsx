import {Check, Crown, Star, Zap} from "lucide-react";

import {Navigation} from "@/components/navigation";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {cn} from "@/lib/utils";

export default function SubscriptionPage() {
    const tiers = [
        {
            name: "Basic",
            price: "Free",
            description: "Essential features for everyone",
            features: [
                "Profile creation",
                "Infinite scrolling feed",
                "Basic messaging",
                "Join groups & events",
                "3D Network view (limited)",
            ],
            icon: Star,
            buttonText: "Current Plan",
            variant: "outline" as const,
        },
        {
            name: "Premium",
            price: "$9.99/mo",
            description: "Enhanced social experience",
            features: [
                "Everything in Basic",
                "Text-to-Speech for messages",
                "Video & GIF sharing",
                "Advanced 3D Network tools",
                "Priority support",
                "Audio/Video chat rooms",
            ],
            icon: Zap,
            buttonText: "Upgrade to Premium",
            variant: "default" as const,
            popular: true,
        },
        {
            name: "Lifetime",
            price: "$199",
            description: "One-time payment for eternal access",
            features: [
                "Everything in Premium",
                "Exclusive badges",
                "No recurring fees",
                "Early access to new features",
                "VR Support beta",
                "Dedicated account manager",
            ],
            icon: Crown,
            buttonText: "Get Lifetime Access",
            variant: "outline" as const,
        },
    ];

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="mb-12 text-center">
                        <h1 className="text-4xl font-bold text-gradient mb-4">Choose Your Experience</h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Support the Velvet Galaxy community and unlock exclusive features to enhance your
                            connections.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {tiers.map((tier) => (
                            <Card
                                key={tier.name}
                                className={cn(
                                    "flex flex-col border-royal-purple/20 bg-card/50 relative overflow-hidden",
                                    tier.popular && "border-royal-purple ring-1 ring-royal-purple"
                                )}
                            >
                                {tier.popular && (
                                    <div
                                        className="absolute top-0 right-0 bg-royal-purple text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider rounded-bl-lg">
                                        Most Popular
                                    </div>
                                )}
                                <CardHeader>
                                    <div className="mb-4">
                                        <tier.icon className="h-10 w-10 text-royal-purple"/>
                                    </div>
                                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                                    <CardDescription>{tier.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="mb-6">
                                        <span className="text-4xl font-bold">{tier.price}</span>
                                        {tier.price !== "Free" && tier.price !== "$199" && (
                                            <span className="text-muted-foreground ml-1">/month</span>
                                        )}
                                    </div>
                                    <ul className="space-y-3">
                                        {tier.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-3 text-sm">
                                                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0"/>
                                                <span className="text-muted-foreground">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className={cn(
                                            "w-full",
                                            tier.popular
                                                ? "bg-gradient-to-r from-royal-purple to-royal-blue hover:opacity-90"
                                                : "border-royal-purple/30"
                                        )}
                                        variant={tier.variant}
                                    >
                                        {tier.buttonText}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
        </>
    );
}
