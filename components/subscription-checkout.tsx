"use client";

import {EmbeddedCheckout, EmbeddedCheckoutProvider} from "@stripe/react-stripe-js";
import {loadStripe} from "@stripe/stripe-js";
import {AlertCircle} from "lucide-react";
import {useCallback, useEffect, useState} from "react";

import {startCheckoutSession} from "@/app/actions/stripe";
import {Alert, AlertDescription} from "@/components/ui/alert";

const getStripeKey = () => {
    const key = process.env.VITE_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    console.log("[v0] Stripe key available:", !!key);
    return key;
};

const stripeKey = getStripeKey();
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

export default function SubscriptionCheckout({productId}: { productId: string }) {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!stripePromise) {
            setError("Stripe configuration is missing. Please check your environment variables.");
            setIsLoading(false);
            return;
        }

        stripePromise
            .then((stripe) => {
                if (!stripe) {
                    setError("Failed to load Stripe. Please refresh the page and try again.");
                }
                setIsLoading(false);
            })
            .catch((err) => {
                console.error("[v0] Stripe loading error:", err);
                setError("Failed to initialize payment system. Please try again later.");
                setIsLoading(false);
            });
    }, []);

    const startCheckoutSessionForProduct = useCallback(async () => {
        try {
            console.log("[v0] Starting checkout session for product:", productId);
            const clientSecret = await startCheckoutSession(productId);
            console.log("[v0] Checkout session created successfully");
            if (!clientSecret) {
                throw new Error("No client secret returned from server");
            }
            return clientSecret;
        } catch (err) {
            console.error("[v0] Checkout session error:", err);
            setError(err instanceof Error ? err.message : "Failed to start checkout session");
            throw err;
        }
    }, [productId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading payment system...</p>
                </div>
            </div>
        );
    }

    if (error || !stripePromise) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4"/>
                <AlertDescription>{error || "Payment system unavailable"}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div id="checkout" className="w-full">
            <EmbeddedCheckoutProvider stripe={stripePromise}
                                      options={{fetchClientSecret: startCheckoutSessionForProduct}}>
                <EmbeddedCheckout/>
            </EmbeddedCheckoutProvider>
        </div>
    );
}
