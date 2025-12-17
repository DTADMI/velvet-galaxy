import {Check} from "lucide-react";
import Link from "next/link";

import {checkSubscriptionStatus} from "@/app/actions/stripe";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {SUBSCRIPTION_PRODUCTS} from "@/lib/products";

export default async function SubscribePage() {
    const {isPremium, tier, expiresAt} = await checkSubscriptionStatus();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">Upgrade to Premium</h1>
                    <p className="text-lg text-muted-foreground">
                        Unlock exclusive features and take your experience to the next level
                    </p>
                    {isPremium && (
                        <Badge className="mt-4" variant="default">
                            Current Plan: {tier} {expiresAt && `(Expires: ${new Date(expiresAt).toLocaleDateString()})`}
                        </Badge>
                    )}
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {SUBSCRIPTION_PRODUCTS.map((product) => (
                        <Card key={product.id}
                              className={product.id === "premium-year" ? "border-primary shadow-lg" : ""}>
                            <CardHeader>
                                {product.id === "premium-year" && <Badge className="w-fit mb-2">Most Popular</Badge>}
                                <CardTitle>{product.name}</CardTitle>
                                <CardDescription>{product.description}</CardDescription>
                                <div className="mt-4">
                                    <span
                                        className="text-3xl font-bold">${(product.priceInCents / 100).toFixed(2)}</span>
                                    {product.duration !== "lifetime" && (
                                        <span className="text-muted-foreground">/{product.duration}</span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 mb-6">
                                    {product.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <Check className="h-5 w-5 text-primary shrink-0 mt-0.5"/>
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Button asChild className="w-full">
                                    <Link
                                        href={`/subscribe/checkout?product=${product.id}`}>Choose {product.name}</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
