"use server";

import {revalidatePath} from "next/cache";

import {SUBSCRIPTION_PRODUCTS} from "@/lib/products";
import {stripe} from "@/lib/stripe";
import {createServerClient} from "@/lib/supabase/server";

export async function startCheckoutSession(productId: string) {
    const product = SUBSCRIPTION_PRODUCTS.find((p) => p.id === productId);
    if (!product) {
        throw new Error(`Product with id "${productId}" not found`);
    }

    const supabase = await createServerClient();
    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User must be authenticated to purchase subscription");
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
        ui_mode: "embedded",
        redirect_on_completion: "never",
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: product.name,
                        description: product.description,
                    },
                    unit_amount: product.priceInCents,
                    ...(product.duration !== "lifetime" && {
                        recurring: {
                            interval: product.duration === "week" ? "week" : product.duration === "month" ? "month" : "year",
                        },
                    }),
                },
                quantity: 1,
            },
        ],
        mode: product.duration === "lifetime" ? "payment" : "subscription",
        metadata: {
            userId: user.id,
            productId: product.id,
            duration: product.duration,
        },
    });

    return session.client_secret;
}

export async function handleSuccessfulPayment(sessionId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid" && session.metadata) {
        const supabase = await createServerClient();
        const {userId, productId: _productId, duration} = session.metadata;

        // Calculate expiry date
        let expiresAt: Date | null = null;
        if (duration !== "lifetime") {
            expiresAt = new Date();
            if (duration === "week") {
                expiresAt.setDate(expiresAt.getDate() + 7);
            } else if (duration === "month") {
                expiresAt.setMonth(expiresAt.getMonth() + 1);
            } else if (duration === "year") {
                expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            }
        }

        // Update subscription in database
        await supabase.from("subscriptions").upsert({
            user_id: userId,
            tier: "premium",
            status: "active",
            stripe_subscription_id: session.subscription as string,
            expires_at: expiresAt?.toISOString(),
        });

        revalidatePath("/");
    }
}

export async function cancelSubscription() {
    const supabase = await createServerClient();
    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User must be authenticated");
    }

    const {data: subscription} = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id")
        .eq("user_id", user.id)
        .single();

    if (subscription?.stripe_subscription_id) {
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);

        await supabase.from("subscriptions").update({status: "cancelled"}).eq("user_id", user.id);

        revalidatePath("/");
    }
}

export async function checkSubscriptionStatus() {
    const supabase = await createServerClient();
    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        return {isPremium: false, tier: "free"};
    }

    const {data: subscription} = await supabase.from("subscriptions").select("*").eq("user_id", user.id).single();

    if (!subscription || subscription.status !== "active") {
        return {isPremium: false, tier: "free"};
    }

    // Check if subscription has expired
    if (subscription.expires_at) {
        const expiryDate = new Date(subscription.expires_at);
        if (expiryDate < new Date()) {
            await supabase.from("subscriptions").update({status: "expired"}).eq("user_id", user.id);

            return {isPremium: false, tier: "free"};
        }
    }

    return {
        isPremium: true,
        tier: subscription.tier,
        expiresAt: subscription.expires_at,
    };
}
